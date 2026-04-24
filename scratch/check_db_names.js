const mongoose = require('mongoose');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';

async function check() {
    await mongoose.connect(MONGO_URL);
    const User = mongoose.model('User', new mongoose.Schema({ fullname: String }));
    const Applicant = mongoose.model('Applicant', new mongoose.Schema({ status: String, applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }));
    const ScreeningResult = mongoose.model('ScreeningResult', new mongoose.Schema({ 
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }));

    const results = await ScreeningResult.find({}).populate({
        path: 'application',
        populate: { path: 'applicant' }
    }).populate('candidate');

    console.log("Total Results:", results.length);
    results.forEach(r => {
        console.log(`Candidate: ${r.candidate?.fullname || r.application?.applicant?.fullname}, Status: ${r.application?.status}`);
    });
    
    await mongoose.disconnect();
}

check();
