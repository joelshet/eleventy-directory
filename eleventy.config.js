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