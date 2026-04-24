import mongoose from "mongoose";
import User from "./src/models/user.model";
import { DbConnection } from "./src/DbConfig/Database";

async function run() {
  await DbConnection();
  const user = await User.findOne({ role: "jobseeker" });
  if (!user) {
    console.log("No jobseeker found");
    process.exit(0);
  }
  console.log("Found user:", user.email);

  const updateData = {
    fullname: user.fullname,
    position: "Test Position",
    skills: JSON.stringify([{ name: "Test Skill", level: "Expert" }]),
    languages: JSON.stringify([]),
    experience: JSON.stringify([]),
    education: JSON.stringify([]),
    certifications: JSON.stringify([]),
    projects: JSON.stringify([]),
    availability: JSON.stringify({ status: "Available", type: "Full-time" }),
    socialLinks: JSON.stringify({ linkedin: "", github: "", portfolio: "" }),
  };

  try {
    
    // --- Parse JSON array fields helper ---
    const parseJSONArray = (val: any, fieldName: string) => {
      if (!val) return undefined;
      try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error(`[UPDATE_PROFILE] Error parsing ${fieldName}:`, e);
        return undefined;
      }
    };
    
    const parsedData: any = { ...updateData };
    parsedData.skills = parseJSONArray(updateData.skills, 'skills');
    parsedData.languages = parseJSONArray(updateData.languages, 'languages');
    parsedData.experience = parseJSONArray(updateData.experience, 'experience');
    parsedData.education = parseJSONArray(updateData.education, 'education');
    parsedData.certifications = parseJSONArray(updateData.certifications, 'certifications');
    parsedData.projects = parseJSONArray(updateData.projects, 'projects');
    parsedData.availability = JSON.parse(updateData.availability);
    parsedData.socialLinks = JSON.parse(updateData.socialLinks);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      parsedData,
      { new: true, runValidators: true }
    );
    console.log("Success!");
  } catch (err: any) {
    console.error("Validation error:", err.message);
  }
  process.exit(0);
}
run();
