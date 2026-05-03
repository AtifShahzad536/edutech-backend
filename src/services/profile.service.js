const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');
const pdf = require('pdf-parse');

const getProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    title: user.title,
    phone: user.phone,
    location: user.location,
    website: user.website,
    linkedin: user.linkedin,
    twitter: user.twitter,
    skills: user.skills,
    experience: user.experience,
    education: user.education
  };
};

const updateProfile = async (userId, updateData) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  const updatedUser = await userRepository.updateUser(userId, updateData);
  
  return {
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
  };
};

const extractSection = (text, header, nextHeader) => {
  try {
    const regex = new RegExp(`${header}\\s*\\n?([\\s\\S]*?)(?:${nextHeader}|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  } catch (e) { return ''; }
};

const importFromLinkedInPDF = async (fileBuffer, userId) => {
  if (!fileBuffer) {
    throw new AppError('No document data received', 400);
  }

  let data;
  try {
    data = await pdf(fileBuffer);
  } catch (err) {
    throw new AppError('Your PDF has a complex structure that our parser could not read', 500);
  }

  const text = data?.text || '';
  if (!text || text.trim().length < 20) {
    throw new AppError('The PDF seems to be an image or protected', 400);
  }

  // Reuse the user's parsing logic inside the service
  const sections = {
    bio: extractSection(text, 'Summary', 'Experience') || extractSection(text, 'About', 'Experience') || text.substring(0, 500).split('\n')[0],
    skills: extractSection(text, 'Skills', 'Education') || extractSection(text, 'Skills & Endorsements', 'Education') || extractSection(text, 'Top Skills', 'Education'),
    experience: extractSection(text, 'Experience', 'Education'),
    education: extractSection(text, 'Education', 'Languages|Certificates|Projects|Skills'),
  };

  const skills = sections.skills.split(/[,\n•|·\t]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 35).slice(0, 12);

  const experienceLines = sections.experience.split('\n').map(l => l.trim()).filter(l => l.length > 3);
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

  const educationLines = sections.education.split('\n').map(l => l.trim()).filter(l => l.length > 4);
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

  const locationMatch = text.match(/([A-Z][a-z]+, [A-Z]{2})|([A-Z][a-z]+, [A-Z][a-z]+)/);
  const location = locationMatch ? locationMatch[0].trim() : "City in Profile";

  const user = await userRepository.findUserById(userId);

  return {
    bio: sections.bio.substring(0, 400).trim() + " (Imported)",
    location: location.substring(0, 40),
    skills: skills.length > 0 ? skills : ["Technology", "Communication"],
    experience: experience,
    education: education,
    firstName: user.firstName,
    lastName: user.lastName
  };
};

module.exports = {
  updateProfile,
  importFromLinkedInPDF,
};
