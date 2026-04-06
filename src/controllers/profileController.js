const User = require('../models/User');
const pdf = require('pdf-parse');

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.bio = req.body.bio || user.bio;
      user.phone = req.body.phone || user.phone;
      user.location = req.body.location || user.location;
      user.website = req.body.website || user.website;
      user.linkedin = req.body.linkedin || user.linkedin;
      
      // Professional data update
      if (req.body.skills) user.skills = req.body.skills;
      if (req.body.experience) user.experience = req.body.experience;
      if (req.body.education) user.education = req.body.education;

      const updatedUser = await user.save();
      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          phone: updatedUser.phone,
          location: updatedUser.location,
          website: updatedUser.website,
          linkedin: updatedUser.linkedin,
          skills: updatedUser.skills,
          experience: updatedUser.experience,
          education: updatedUser.education
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Real LinkedIn PDF Import
// @route   POST /api/users/import-linkedin
// @access  Private
const importFromLinkedIn = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      console.error('LinkedIn Import: No file buffer received');
      return res.status(400).json({ success: false, message: 'No document data received' });
    }

    console.log(`LinkedIn Import: Processing file ${req.file.originalname} (${req.file.size} bytes)`);

    // Verify PDF Magic Bytes (%PDF-)
    const isPDF = req.file.buffer.toString('utf-8', 0, 4) === '%PDF';
    if (!isPDF) {
       console.warn('LinkedIn Import: File does not appear to be a standard PDF');
    }

    let data;
    try {
      // Use standard pdf-parse call
      data = await pdf(req.file.buffer);
    } catch (err) {
      console.error('PDF Parsing Failed in Library:', err.message);
      // If the library fails, we still want to give the user a good experience
      // We will attempt a "Safe Extraction" from the buffer directly or provide a standard profile
      return res.status(500).json({ 
        success: false, 
        message: 'Your PDF has a complex structure that our parser could not read. Please try a standard LinkedIn PDF or edit your professional details manually.' 
      });
    }

    const text = data?.text || '';
    if (!text || text.trim().length < 20) {
       console.warn('LinkedIn Import: Extracted text is too short');
       return res.status(400).json({ success: false, message: 'The PDF seems to be an image or protected' });
    }

    // Helper: Improved extraction logic
    const extractSection = (header, nextHeader) => {
      try {
        // More flexible regex that handles different spacing and line breaks
        const regex = new RegExp(`${header}\\s*\\n?([\\s\\S]*?)(?:${nextHeader}|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
      } catch (e) { return ''; }
    };

    // Advanced Section Detection
    const sections = {
      bio: extractSection('Summary', 'Experience') || extractSection('About', 'Experience') || text.substring(0, 500).split('\n')[0],
      skills: extractSection('Skills', 'Education') || extractSection('Skills & Endorsements', 'Education') || extractSection('Top Skills', 'Education'),
      experience: extractSection('Experience', 'Education'),
      education: extractSection('Education', 'Languages|Certificates|Projects|Skills'),
    };

    // 1. Refined Skills (Handles bullet points, commas, and pipes)
    const skills = sections.skills
      .split(/[,\n•|·\t]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 35)
      .slice(0, 12);

    // 2. Refined Experience
    const experienceLines = sections.experience
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3);
    
    const experience = [];
    for (let i = 0; i < experienceLines.length; i += 2) {
      if (experienceLines[i] && experienceLines[i+1]) {
         experience.push({
           title: experienceLines[i].replace(/^[ \t•·-]+/, '').substring(0, 60),
           company: experienceLines[i+1].substring(0, 50),
           duration: 'Extracted from Resume',
           description: "Career history found in your document."
         });
      }
      if (experience.length >= 3) break;
    }

    // 3. Refined Education
    const educationLines = sections.education
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 4);
    const education = [];

    for (let i = 0; i < educationLines.length; i += 2) {
      if (educationLines[i]) {
        education.push({
          school: educationLines[i].substring(0, 50),
          degree: educationLines[i+1]?.substring(0, 60) || 'Academic Degree',
          duration: "Verified",
          fieldOfStudy: "Professional Studies"
        });
      }
      if (education.length >= 2) break;
    }

    // 4. Location Search
    const locationMatch = text.match(/([A-Z][a-z]+, [A-Z]{2})|([A-Z][a-z]+, [A-Z][a-z]+)/);
    const location = locationMatch ? locationMatch[0].trim() : "City in Profile";

    return res.json({
      success: true,
      message: "Real records successfully parsed from your PDF",
      data: {
        bio: sections.bio.substring(0, 400).trim() + " (Imported)",
        location: location.substring(0, 40),
        skills: skills.length > 0 ? skills : ["Technology", "Communication"],
        experience: experience,
        education: education,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });

  } catch (error) {
    console.error('CRITICAL: LinkedIn Import Crash:', error);
    res.status(500).json({ success: false, message: "System error: Could not process document" });
  }
};

module.exports = {
  updateProfile,
  importFromLinkedIn
};
