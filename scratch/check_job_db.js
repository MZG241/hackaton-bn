const mongoose = require('mongoose');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';

async function check() {
    await mongoose.connect(MONGO_URL);
    const Job = mongoose.model('Job', new mongoose.Schema({ title: String }));
    const User = mongoose.model('User', new mongoose.Schema({ fullname: String }));
    const Applicant = mongoose.model('Applicant', new mongoose.Schema({ 
        status: String, 
        applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
    }));
    const ScreeningResult = mongoose.model('ScreeningResult', new mongoose.Schema({ 
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
    }));

    const jobId = '69e9db8bda46c469afde43ca';
    const results = await ScreeningResult.find({ job: jobId }).populate({
        path: 'application',
        populate: { path: 'applicant' }
    }).populate('candidate');

    console.log("Job ID:", jobId);
    console.log("Total Results for this Job:", results.length);
    results.forEach(r => {
        console.log(`Candidate: ${r.candidate?.fullname}, Status: ${r.application?.status}`);
    });
    
    await mongoose.disconnect();
}

check();
