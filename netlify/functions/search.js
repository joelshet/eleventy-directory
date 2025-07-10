// netlify/functions/search.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const nunjucks = require('nunjucks');

nunjucks.configure('src/_includes');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async function(event) {
  const searchQuery = new URLSearchParams(event.body).get('q');

  let query = supabase.from('directory_listings').select('*');
  if (searchQuery) {
    query = query.textSearch('name', `'${searchQuery}'`);
  }
  const { data: items } = await query;

  const html = items.map(item =>
    nunjucks.render('item-card.njk', { item })
  ).join('');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  };
}; 