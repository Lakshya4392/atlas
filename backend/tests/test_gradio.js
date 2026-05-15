const { client } = require('@gradio/client');

async function test() {
  try {
    const app = await client("InstantX/InstantID");
    const info = await app.view_api();
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
