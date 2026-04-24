const mongoose = require('mongoose');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';

async function check() {
    await mongoose.connect(MONGO_URL);
    const Applicant = mongoose.model('Applicant', new mongoose.Schema({ status: String }));
    const ScreeningResult = mongoose.model('ScreeningResult', new mongoose.Schema({ 
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' } 
    }));

    const results = await ScreeningResult.find({}).populate('application');
    console.log("Total Results:", results.length);
    results.forEach(r => {
        console.log(`Result ID: ${r._id}, App ID: ${r.application?._id}, Status: ${r.application?.status}`);
    });
    
    await mongoose.disconnect();
}

check();
