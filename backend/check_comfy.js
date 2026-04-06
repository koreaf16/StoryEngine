const axios = require('axios');

async function getComfyHistory() {
  const baseUrl = 'http://192.168.0.3:8189';
  try {
    const resp = await axios.get(`${baseUrl}/history`);
    const history = resp.data;
    
    console.log(`Found ${Object.keys(history).length} items in history`);
    
    for (const promptId in history) {
      const entry = history[promptId];
      const prompt = entry.prompt;
      const outputs = entry.outputs;
      
      // Look for LoRA training or Flux related jobs
      // We can check the node types in entry.prompt[1] etc.
      
      // Find if "han_soyul" or "soyul" is in the prompt
      const promptStr = JSON.stringify(prompt);
      if (promptStr.includes('soyul') || promptStr.includes('soyul')) {
        console.log(`--- Match for soyul in promptId: ${promptId} ---`);
        // Calculate duration: how to get start/end time from history?
        // ComfyUI history entry usually doesn't have explicit timestamps in the JSON?
        // Wait, ComfyUI history might have metadata or we check the order.
        // Actually, let's see what's inside the entry.
        console.log('Status:', entry.status);
        // Duration might be in status.messages or we can't tell easily.
        // But maybe the user is referring to a "benchmark" or a "log".
      }
    }
  } catch (err) {
    console.error('Error fetching history:', err.message);
  }
}

getComfyHistory();
