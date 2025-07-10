---
title: Minimal Directory Website with Eleventy, HTMX, and Leaflet
date: 2023-10-27
layout: post.njk
tags: [post]
---

# Complete Guide: Minimal Directory Website with Eleventy, HTMX, and Leaflet

This tutorial will walk you through creating a minimal, production-ready directory website from scratch using Eleventy, HTMX, and Leaflet.js, all powered by a Supabase backend.

### Goal:
A fast, SEO-friendly directory website with a blog. The directory will feature a live search and an interactive map.

### Stack:
*   **Backend:** Supabase (Postgres)
*   **Frontend Framework:** Eleventy (SSG)
*   **Dynamic UX:** HTMX
*   **Mapping:** Leaflet.js
*   **Deployment:** Netlify (or any host supporting serverless functions)

---

## Part 0: Prerequisites

1.  **Node.js:** Make sure you have Node.js installed on your machine.
2.  **Supabase Project:**
    *   Create a new project on [Supabase](https://supabase.com/).
    *   Go to the **SQL Editor** and run the following query to create your table:

    ```sql
    CREATE TABLE directory_listings (
      id bigint PRIMARY KEY generated always as identity,
      name text not null,
      description text,
      website_url text,
      image_url text, -- This will be a URL to an image in Supabase Storage
      latitude real,  -- e.g., 40.7128
      longitude real, -- e.g., -74.0060
      tags text[]
    );

    -- Enable Row Level Security (important!)
    ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

    -- Create a policy to allow anyone to READ the data
    CREATE POLICY "Allow public read access" ON directory_listings
      FOR SELECT USING (true);

    -- Insert some sample data to work with
    INSERT INTO directory_listings (name, description, website_url, image_url, latitude, longitude)
    VALUES
      ('Central Park', 'An urban park in Manhattan, New York City.', 'https://www.centralparknyc.org/', 'https://your-supabase-url.co/storage/v1/object/public/images/central-park.jpg', 40.785091, -73.968285),
      ('Brooklyn Bridge', 'A hybrid cable-stayed/suspension bridge in New York City.', 'https://www.nyc.gov/html/dot/html/infrastructure/brooklyn-bridge.shtml', 'https://your-supabase-url.co/storage/v1/object/public/images/brooklyn-bridge.jpg', 40.706086, -73.996864);
    ```
    *   Go to **Storage** and create a public bucket called `images`. Upload a couple of sample images and get their public URLs to put in your database.
    *   Go to **Project Settings > API** and copy your **Project URL** and **`anon` public key**.

---

## Part 1: Basic Eleventy Setup

Let's build the static foundation.

1.  **Initialize Your Project:**
    Open your terminal and run:
    ```bash
    mkdir my-directory-site
    cd my-directory-site
    npm init -y
    npm install @11ty/eleventy
    ```

2.  **Configure Eleventy:**
    Create a file named `eleventy.config.js`:
    ```javascript
    // eleventy.config.js
    module.exports = function(eleventyConfig) {
      // Tell Eleventy to copy the css, js, and img folders to the output
      eleventyConfig.addPassthroughCopy("./src/css");
      eleventyConfig.addPassthroughCopy("./src/js");
      eleventyConfig.addPassthroughCopy("./src/img");

      return {
        dir: {
          input: "src",
          output: "_site",
          includes: "_includes",
          data: "_data"
        }
      };
    };
    ```

3.  **Create Folder Structure:**
    ```bash
    mkdir -p src/_includes src/_data src/css src/js src/blog
    ```

4.  **Create the Main Layout (`src/_includes/layout.njk`):**
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{% raw %}{{ title }}{% endraw %}</title>
      <link rel="stylesheet" href="/css/style.css">
      <!-- Leaflet CSS -->
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    </head>
    <body>
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/blog/">Blog</a>
        </nav>
      </header>
      <main>
        {% raw %}{{ content | safe }}{% endraw %}
      </main>
      <!-- HTMX -->
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <!-- Leaflet.js -->
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <!-- Hotkeys.js -->
      <script src="https://unpkg.com/hotkeys-js/dist/hotkeys.min.js"></script>
    </body>
    </html>
    ```

5.  **Create a simple stylesheet (`src/css/style.css`):**
    ```css
    body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 2rem; }
    nav a { margin-right: 1rem; }
    .directory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .card { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; }
    .card.highlight { border-color: royalblue; border-width: 2px; }
    #map { height: 400px; margin: 2rem 0; }
    input[type="search"] { width: 100%; padding: 0.8rem; font-size: 1.2rem; margin-bottom: 1rem; }
    ```

6.  **Add a `package.json` script to run the server:**
    Open `package.json` and add the `start` script:
    ```json
    "scripts": {
      "start": "eleventy --serve",
      "test": "echo \"Error: no test specified\" && exit 1"
    },
    ```

---

## Part 2: Connect to Supabase & Build the Directory

1.  **Install dependencies:**
    ```bash
    npm install @supabase/supabase-js dotenv
    ```

2.  **Create a `.env` file** in your root directory to store your secrets. **Do not commit this file!** Create a `.gitignore` file and add `.env` and `node_modules/` to it.
    ```
    # .env
    SUPABASE_URL="YOUR_PROJECT_URL_HERE"
    SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"
    ```

    Create `.gitignore`:
    ```
    node_modules/
    .env
    _site/
    ```

3.  **Fetch Data (`src/_data/directory.js`):**
    ```javascript
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
    ```

4.  **Create a Reusable Card Partial (`src/_includes/item-card.njk`):**
    ```html
    <div class="card" id="item-{% raw %}{{ item.id }}{% endraw %}" data-lat="{% raw %}{{ item.latitude }}{% endraw %}" data-lon="{% raw %}{{ item.longitude }}{% endraw %}">
      {% raw %}{% if item.image_url %}{% endraw %}
        <img src="{% raw %}{{ item.image_url }}{% endraw %}" alt="{% raw %}{{ item.name }}{% endraw %}" style="width:100%; height:auto;">
      {% raw %}{% endif %}{% endraw %}
      <h2>{% raw %}{{ item.name }}{% endraw %}</h2>
      <p>{% raw %}{{ item.description }}{% endraw %}</p>
      <a href="{% raw %}{{ item.website_url }}{% endraw %}" target="_blank" rel="noopener noreferrer">Visit Website</a>
    </div>
    ```

5.  **Create the Homepage (`src/index.njk`):**
    ```nunjucks
    ---
    title: My Awesome Directory
    layout: layout.njk
    ---

    <h1>My Awesome Directory</h1>

    <div id="map"></div>

    <input
      type="search"
      name="q"
      placeholder="Search for an item... (Press '/' to focus)"
      hx-post="/.netlify/functions/search"
      hx-trigger="keyup changed delay:300ms"
      hx-target="#directory-results"
    />

    <div id="directory-results" class="directory-grid">
      {% raw %}{% for item in directory %}{% endraw %}
        {% raw %}{% include "item-card.njk" %}{% endraw %}
      {% raw %}{% endfor %}{% endraw %}
    </div>

    {% raw %}{# Pass location data to our client-side map script #}{% endraw %}
    <script>
      const locations = {% raw %}{{ directory | dump | safe }}{% endraw %};
    </script>
    <script src="/js/map.js" defer></script>

    {% raw %}{# Keyboard Shortcut Script #}{% endraw %}
    <script>
      hotkeys('/', function(event) {
        event.preventDefault();
        document.querySelector('input[name="q"]').focus();
      });
    </script>
    ```

---

## Part 3: Adding the Blog

1.  **Create a Post Layout (`src/_includes/post.njk`):**
    ```html
    ---
    layout: layout.njk
    ---
    <h1>{% raw %}{{ title }}{% endraw %}</h1>
    <p>Published on {% raw %}{{ page.date.toDateString() }}{% endraw %}</p>
    {% raw %}{{ content | safe }}{% endraw %}
    ```

2.  **Create a Sample Post (`src/blog/my-first-post.md`):**
    ```markdown
    ---
    title: My First Post
    date: 2023-10-27
    layout: post.njk
    tags: [post]
    ---
    Welcome to my blog!

    This is content written in markdown. Eleventy makes it incredibly easy to manage.
    ```

3.  **Create the Blog Index (`src/blog.njk`):**
    ```nunjucks
    ---
    title: The Blog
    layout: layout.njk
    ---
    <h1>The Blog</h1>
    <ul>
      {% raw %}{%- for post in collections.post | reverse -%}{% endraw %}
        <li>
          <a href="{% raw %}{{ post.url }}{% endraw %}">{% raw %}{{ post.data.title }}{% endraw %}</a>
          - <span>{% raw %}{{ post.date.toDateString() }}{% endraw %}</span>
        </li>
      {% raw %}{%- endfor -%}{% endraw %}
    </ul>
    ```
    *Note: We used `tags: [post]` in our markdown file. This automatically creates `collections.post`.*

---

## Part 4: Making it Live with HTMX Search

1.  **Configure Netlify:** Create a `netlify.toml` file in your root.
    ```toml
    [build]
      command = "npm install && npx @11ty/eleventy"
      publish = "_site"

    [functions]
      directory = "netlify/functions"
      node_bundler = "esbuild"
    ```

2.  **Create the Serverless Function:**
    ```bash
    mkdir -p netlify/functions
    ```
    Create `netlify/functions/search.js`:
    ```javascript
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
          <h2>${item.name}</h2>
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
    ```

---

## Part 5: Adding the Interactive Map

1.  **Create the Map Script (`src/js/map.js`):**
    ```javascript
    // src/js/map.js
    if (typeof locations !== 'undefined' && locations.length > 0) {
      const map = L.map('map').setView([locations[0].latitude, locations[0].longitude], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create a layer group to hold markers
      const markerGroup = L.layerGroup().addTo(map);

      function renderMarkers(items) {
        markerGroup.clearLayers(); // Clear old markers
        items.forEach(item => {
          if (item.latitude && item.longitude) {
            const marker = L.marker([item.latitude, item.longitude]);
            marker.bindPopup(`<b>${item.name}</b>`);
            marker.on('click', () => highlightCard(item.id));
            marker.addTo(markerGroup);
          }
        });
      }

      function highlightCard(itemId) {
        document.querySelectorAll('.card.highlight').forEach(c => c.classList.remove('highlight'));
        const cardElement = document.getElementById(`item-${itemId}`);
        if (cardElement) {
          cardElement.classList.add('highlight');
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Initial render
      renderMarkers(locations);

      // Listen for HTMX finishing a request to update the map
      document.body.addEventListener('htmx:afterSwap', function(evt) {
        // We need to get the new items from the DOM, as 'locations' is stale
        const newItems = Array.from(document.querySelectorAll('.card')).map(card => ({
            id: card.id.replace('item-',''),
            latitude: card.dataset.lat,
            longitude: card.dataset.lon,
            name: card.querySelector('h2').innerText // A bit hacky, but works for the demo
        }));
        renderMarkers(newItems);
      });

      // Add click listeners to cards
      document.getElementById('directory-results').addEventListener('click', (e) => {
          const card = e.target.closest('.card');
          if (card) {
              map.flyTo([card.dataset.lat, card.dataset.lon], 14);
          }
      });
    }
    ```

---

## Part 6: Testing and Deployment

### To Run Everything:

1.  **Basic Development:**
    ```bash
    npm start
    ```
    This starts the Eleventy dev server for static content.

2.  **Full Local Testing (with serverless functions):**
    ```bash
    # Install Netlify CLI globally
    npm install -g netlify-cli
    
    # Run with serverless functions
    netlify dev
    ```
    This runs your Eleventy build AND your serverless functions locally.

### Deploy to Production:

**Option 1: Via GitHub (Recommended)**
1. Push your code to GitHub
2. Connect to Netlify and import your repository
3. Add environment variables in Netlify dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy automatically

**Option 2: Via CLI**
```bash
netlify deploy --prod
```

---

## Important Notes:

1. **Template Duplication:** The card template exists in both `src/_includes/item-card.njk` and `netlify/functions/search.js`. This is intentional for simplicity and production reliability.

2. **Environment Variables:** Never commit your `.env` file. Always set environment variables in your deployment platform.

3. **Search Function:** The serverless function generates HTML directly to avoid template file access issues in production.

4. **Minimal Dependencies:** This approach keeps the project lightweight and maintainable.

---

## Final File Structure:
```
my-directory-site/
├── netlify/
│   └── functions/
│       └── search.js
├── src/
│   ├── _data/
│   │   └── directory.js
│   ├── _includes/
│   │   ├── layout.njk
│   │   ├── item-card.njk
│   │   └── post.njk
│   ├── blog/
│   │   └── my-first-post.md
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── map.js
│   ├── blog.njk
│   └── index.njk
├── .env
├── .gitignore
├── eleventy.config.js
├── netlify.toml
└── package.json
```

You now have a fully functional, minimal, and production-ready directory website! 🎉 