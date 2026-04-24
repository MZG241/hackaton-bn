import { Request, Response } from "express";
import Job from "../models/job.model";
import User from "../models/user.model";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found" })
    }

    return res.status(200).json({ success: true, data: user });

  } catch (error: any) {
    console.log("Error while getting user profile : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getJobSeeker = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    console.log(`[Backend] getJobSeeker called - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const query: any = { role: "jobseeker" };
    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const [jobseekers, totalCount] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: jobseekers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.log("Error while getting jobseekers : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getJobSeekerStats = async (req: Request, res: Response) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [total, newThisMonth] = await Promise.all([
      User.countDocuments({ role: "jobseeker" }),
      User.countDocuments({ role: "jobseeker", createdAt: { $gt: oneMonthAgo } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        newThisMonth,
        withResume: total // Placeholder for specific resume logic if needed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getEmployer = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    console.log(`[Backend] getEmployer called - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const query: any = { role: "employer" };
    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const [employers, totalCount] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: employers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getEmployerStats = async (req: Request, res: Response) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [total, newThisMonth, active] = await Promise.all([
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "employer", createdAt: { $gt: oneMonthAgo } }),
      User.countDocuments({ role: "employer", isActive: true })
    ]);

    return res.status(200).json({
      success: true,
      data: { total, newThisMonth, active }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    console.log(`[Backend] getJobs called - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .populate('postedBy', 'companyName companyLogo fullname')
        .skip(skip)
        .limit(limit),
      Job.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.log("Error while getting jobs : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getCompanyJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const jobs = await Job.find({ postedBy: id }).sort({ createdAt: -1 }).populate('postedBy', 'companyName companyDescription companyLogo');

    if (jobs.length === 0) {
      return res.status(200).json({ success: true, message: "No jobs found" });
    }

    return res.status(200).json({ success: true, data: jobs });

  } catch (error: any) {
    console.log("Error while getting jobs by company : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const [opened, closed] = await Promise.all([
      Job.countDocuments({ isClosed: false }),
      Job.countDocuments({ isClosed: true })
    ]);

    return res.status(200).json({
      success: true,
      data: { opened, closed, total: opened + closed }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin CRUD and Detailed Views
import Applicant from "../models/applicant.model";

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Also delete their jobs if they are an employer
    if (user.role === 'employer') {
      await Job.deleteMany({ postedBy: id });
    }

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobSeekerApplications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const applications = await Applicant.find({ applicant: id })
      .populate({
        path: 'job',
        populate: { path: 'postedBy', select: 'companyName companyLogo' }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobApplicants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Job ID
    const applicants = await Applicant.find({ job: id })
      .populate('applicant', 'fullname email profileImage location position skills resume')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: applicants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};