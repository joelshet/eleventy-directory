// netlify/functions/search.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async function(event) {
  const searchQuery = new URLSearchParams(event.body).get('q');

  let query = supabase.from('directory_listings').select('*');
  if (searchQuery) {
    query = query.textSearch('name', `'${searchQuery}'`);
  }
  const { data: items } = await query;

  const html = items.map(item => `
    <div class="card" id="item-${item.id}" data-lat="${item.latitude}" data-lon="${item.longitude}">
      ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%; height:auto;">` : ''}
      <h3>${item.name}</h3>
      <p>${item.description || ''}</p>
      <a href="${item.website_url}" target="_blank" rel="noopener noreferrer">Visit Website</a>
    </div>
  `).join('');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  };
}; 