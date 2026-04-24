const mongoose = require('mongoose');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';

async function check() {
    await mongoose.connect(MONGO_URL);
    const User = mongoose.model('User', new mongoose.Schema({ fullname: String }));
    const Applicant = mongoose.model('Applicant', new mongoose.Schema({ 
        status: String, 
        applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
    }));
    const ScreeningResult = mongoose.model('ScreeningResult', new mongoose.Schema({ 
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }));

    const solange = await User.findOne({ fullname: /Solange/i });
    if (!solange) {
        console.log("Solange not found");
        return;
    }

    const results = await ScreeningResult.find({ candidate: solange._id }).populate({
        path: 'application'
    });

    console.log("Solange ID:", solange._id);
    console.log("Total Results for Solange:", results.length);
    results.forEach(r => {
        console.log(`Result ID: ${r._id}, Job ID: ${r.job}, App ID: ${r.application?._id}, Status: ${r.application?.status}`);
    });
    
    await mongoose.disconnect();
}

check();
