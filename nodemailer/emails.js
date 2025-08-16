import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { transporter } from "./nodemailer.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    if (!email) throw new Error("No email address provided");

    // Customize template for Akazi
    const akaziVerificationTemplate = VERIFICATION_EMAIL_TEMPLATE
      .replace(/{verificationCode}/g, verificationToken)
      .replace(/Azaki/g, 'Akazi');

    const mailOptions = {
      from: `Akazi Recruitment <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Akazi Recruitment Platform",
      html: akaziVerificationTemplate,
    };

    const response = await transporter.sendMail(mailOptions);
    return response;
  } catch (error) {
    console.error(`Error sending verification email to ${email}`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name, role) => {
  try {
    // Determine user type for personalized message
    const userType = role === 'employer' ? 'Employer' : 'Job Seeker';
    const resources = role === 'employer' 
      ? 'access our talent database and recruitment tools' 
      : 'browse job opportunities and career resources';

    const mailOptions = {
      from: `Akazi Recruitment <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to Akazi, ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Akazi!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
            <p>Hello ${name},</p>
            <p>Welcome to <strong>Akazi Recruitment Platform</strong>! We're excited to have you as a ${userType} on our platform.</p>
            <p>Your account is now active and ready to use. You can now ${resources}.</p>
            <p>To get started, we recommend:</p>
            <ul>
              ${role === 'employer' 
                ? `<li>Complete your company profile</li>
                   <li>Post your first job listing</li>
                   <li>Explore our candidate search tools</li>`
                : `<li>Complete your professional profile</li>
                   <li>Upload your resume/CV</li>
                   <li>Set up job alerts for new opportunities</li>`}
            </ul>
            <p>If you need any assistance, our support team is available at support@akazi.com</p>
            <p>Best regards,<br><strong>The Akazi Team</strong></p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
            <p>© ${new Date().getFullYear()} Akazi Recruitment Platform. Connecting talent with opportunity.</p>
          </div>
        </div>
      `,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully");
    return response;
  } catch (error) {
    console.error(`Error sending welcome email`, error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    // Customize template for Akazi
    const akaziResetTemplate = PASSWORD_RESET_REQUEST_TEMPLATE
      .replace(/{resetURL}/g, resetURL)
      .replace(/Azaki/g, 'Akazi');

    const mailOptions = {
      from: `Akazi Recruitment <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - Akazi Recruitment Platform",
      html: akaziResetTemplate,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
    return response;
  } catch (error) {
    console.error(`Error sending password reset email`, error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendResetSuccessEmail = async (email, name) => {
  try {
    // Customize template for Akazi
    const akaziSuccessTemplate = PASSWORD_RESET_SUCCESS_TEMPLATE
      .replace(/Azaki/g, 'Akazi');

    const mailOptions = {
      from: `Akazi Recruitment <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Confirmed - Akazi Recruitment Platform",
      html: akaziSuccessTemplate,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("Password reset confirmation email sent successfully");
    return response;
  } catch (error) {
    console.error(`Error sending password reset confirmation email`, error);
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
};

// New function for job application notifications
export const sendApplicationNotification = async (employerEmail, jobTitle, candidateName) => {
  try {
    const mailOptions = {
      from: `Akazi Recruitment <${process.env.EMAIL_USER}>`,
      to: employerEmail,
      subject: `New Application for ${jobTitle} - Akazi`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0;">New Job Application</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
            <p>Hello,</p>
            <p>You've received a new application for your job posting: <strong>${jobTitle}</strong></p>
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p>You can review this application and others in your employer dashboard:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CLIENT_URL}/employer/dashboard" style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Applications
              </a>
            </div>
            <p>Best regards,<br><strong>The Akazi Team</strong></p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
            <p>© ${new Date().getFullYear()} Akazi Recruitment Platform. Connecting talent with opportunity.</p>
          </div>
        </div>
      `,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("Application notification email sent successfully");
    return response;
  } catch (error) {
    console.error(`Error sending application notification email`, error);
    throw new Error(`Failed to send application notification: ${error.message}`);
  }
};