# chatgpt-category-worker
A Cloudflare Worker that updates a Zendesk Ticket Category and Sentiment Tag

## Cloudflare Variables
- CATEGORY	{zendesk category custom field id}
- DOMAIN	d3v-verschoren
- OPENAI	{openai API key} //encrypted
- SENTIMENT	{zendesk sentiment custom field id}
- TOKEN	 {base 64 encode: email:token/zendesk_token} //encrypted

## URL
Create a Zendesk webhook thatdoes a get to: https://your.workers.url/{{ticket_id}}

## Example Categories
```csv
value,tag,default
Order status inquiries,order,false
Shipping and delivery questions,delivery,false
Product information requests,product,false
Returns and exchanges,returns,false
Payment and billing issues,payment,false
Technical support for online store,technical,false
Website navigation and usability issues,website,false
Gift card inquiries,gift,false
Loyalty program questions,loyalty,false
Promotions and discounts inquiries,promotions,false
Inventory and stock availability questions,inventory,false
Customer account management,account,false
Complaints and feedback,complaint,false
Product recommendations and suggestions,recommendation,false
Affiliate program inquiries,affiliate,false
Store location and hours inquiries,location,false
Marketing and advertising inquiries,marketing,false
Privacy and security concerns,privacy,false
General inquiries and FAQ,general,false
Other/miscellaneous issues,misc,false
```
