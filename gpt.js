const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.openAi_api_key
});

const askGpt = async(data)=> {
    const prompt=`You're building an email classifier. Given the content of an email ${data}, you need to determine its label: "Interested," "Not Interested," or "More Information."

    Interested: The email expresses clear interest in your product/service.
    Not Interested: The email indicates a lack of interest in your product/service.
    More Information: The email requests additional details or clarifications.
    If the label is "Interested," prompt the user to inquire whether they would like to schedule a demo call and suggest a convenient time.`
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'assistant', content: prompt }],
        model: 'gpt-3.5-turbo',
      });
      let result = await chatCompletion.choices[0].message.content
   
      
      return result;   
  }


module.exports = {
  askGpt
};