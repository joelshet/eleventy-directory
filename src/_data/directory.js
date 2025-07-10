// src/_data/directory.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function() {
  const { data } = await supabase
    .from('directory_listings')
    .select('*')
    .order('name');
  return data;
}; 