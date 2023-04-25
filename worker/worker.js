export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    var ticket_id = path.split('/')[1];

    if (ticket_id < 1){
      //check for a bad ticket ID
      return new Response('Invalid Path', { status: 404 })
    }

    var categories = await getCustomField(env,env.CATEGORY);
    var sentiments = await getCustomField(env,env.SENTIMENT);
    var conversation = await getTicketDescription(env,ticket_id);
    // console.log("CONVERSATION",conversation);

    var category_prompt = getPrompt(categories,conversation);
    var sentiment_prompt = getPrompt(sentiments,conversation);
    
    var category = await openAIRequest(env,category_prompt);
    if (!category){
      category = await openAIRequest(env,category_prompt);
    }
    var sentiment = await openAIRequest(env,sentiment_prompt);
    if (!sentiment){
      sentiment = await openAIRequest(env,sentiment_prompt);
    }

    if (category || sentiment){
      await updateTicket(env,category,sentiment,ticket_id);
      return new Response("Ticket updated: " + category+' '+sentiment)
    } else {
      return new Response('Nothing could be mapped', {"status":500});
    }
  }
}

function getPrompt(categories,conversation){
  return `
  Check this JSON object of categories:
      ${JSON.stringify(categories)}

  Now read this description: ${conversation}
  Return only a valid JSON element from the array of categories that best matches this conversation.
  `
}

async function updateTicket(env,category,sentiment,ticket_id){
  const url = `https://${env.DOMAIN}.zendesk.com/api/v2/tickets/${ticket_id}.json`;
  const ticket = {
    "ticket": {
      "custom_fields": [
        {"id": env.CATEGORY, value: category},
        {"id": env.SENTIMENT, value: sentiment},
      ]
    }
  }

  const init = {
      body: JSON.stringify(ticket),
      method: "PUT",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "authorization": "Basic " + env.TOKEN
      },
    };
  const response = await fetch(url,init);
  const results = await response.json();
  return results;

}

async function getCustomField(env,field_id){
  const url = `https://${env.DOMAIN}.zendesk.com/api/v2/ticket_fields/${field_id}.json`;
  

  const init = {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "authorization": "Basic " + env.TOKEN
      },
    };
  const response = await fetch(url,init);
  const results = await response.json();
  var options = results.ticket_field.custom_field_options;
  var cleaned_options = options.map(({raw_name, ['default']: _, ...rest}) => rest);
  cleaned_options = cleaned_options.map(({['id']: _, ...rest}) => rest);
  return cleaned_options;
}

async function getTicketDescription(env,ticket_id){
  const url = `https://${env.DOMAIN}.zendesk.com/api/v2/tickets/${ticket_id}.json`;
  const init = {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "authorization": "Basic " + env.TOKEN
      },
    };
  const response = await fetch(url,init);
  const results = await response.json();
  var description = results.ticket.description;
  
  //Remove HTML Code to trim description
  const regex = /<[^>]*>/g;
  const cleaned = description.replace(regex, " ");

  //The limit is 4097 tokens for the API with ~4 characters per token. 
  //So let's trim the description to 15k characters to be safe.
  const trimmed = cleaned.substr(0, 10000);

  return trimmed;
}

async function openAIRequest(env,prompt){
  const request = {
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.6,
    max_tokens: 200,
  }
  const url = "https://api.openai.com/v1/completions";

  const init = {
      body: JSON.stringify(request),
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "authorization": "Bearer " + env.OPENAI
      },
    };
  const response = await fetch(url, init);
  const results = await response.json();
  console.log("openAI",results)
  var text = results.choices[0].text.trim();
  text = text.replace("\n  Answer: ","");
  text = text.replace("Answer: ","");
  text = text.replace("\n  ","");
  text = text.replace("value:","\"value\":")
  text = text.replace("name:","\"name\":")
  console.log(text);
   try {
    const parsedJSON = JSON.parse(text);
    return parsedJSON.value;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}
