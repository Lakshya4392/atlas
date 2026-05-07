const Replicate = require('replicate');
require('dotenv').config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function findModels() {
  const modelsToCheck = [
    ["zsxkib", "dream-o"],
    ["cedoysch", "flux-fill-redux-try-on"],
    ["subhash25rawat", "flux-vton"],
    ["levihsu", "cat-vton"],
    ["viktorfa", "human-parsing"],
  ];

  for (const [owner, name] of modelsToCheck) {
    try {
      const model = await replicate.models.get(owner, name);
      const ver = model.latest_version?.id;
      console.log(`✅ ${owner}/${name}`);
      console.log(`   Version: ${ver}`);
    } catch (e) {
      console.log(`❌ ${owner}/${name}: ${e.message.includes('404') ? 'NOT FOUND' : e.message}`);
    }
  }
}

findModels();
