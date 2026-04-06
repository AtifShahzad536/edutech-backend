const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('../src/models/Course');

dotenv.config({ path: path.join(__dirname, '../.env') });

const images = {
  development: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
  design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
  business: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
  marketing: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2074&auto=format&fit=crop',
  programming: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
};

const updateThumbnails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const courses = await Course.find();
    console.log(`Found ${courses.length} courses to update.`);

    for (const course of courses) {
      const cat = course.category?.toLowerCase() || 'programming';
      const thumb = images[cat] || images.programming;
      
      course.thumbnail = thumb;
      await course.save();
      console.log(`Updated thumbnail for: ${course.title}`);
    }

    console.log('Successfully updated all thumbnails!');
    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
};

updateThumbnails();
