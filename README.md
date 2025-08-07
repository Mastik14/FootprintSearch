My demo link - https://mastik14.github.io/FootprintSearch/

# Countries carbon footprint bar charts

**Main Goal**

Create a chart animating carbon footprint per country throughout the years. The below chart is an example for world emissions by year (see for animated version)

![https://miro.medium.com/max/1600/1*37uCN6y1WyLukxwCadhWRw.gif](https://miro.medium.com/max/1600/1*37uCN6y1WyLukxwCadhWRw.gif)

**Main Requirements**

1. Implement the provided horizontal bar charts file as an Angular application
2. Use data from the [Footprint network](https://data.footprintnetwork.org/#/api)
3. Create the chart
4. Calculate and show world total footprint on the page

**Additional goals**

1. animate the sorting and bar length of the chart as per the provided example.
2. chart should be responsive, test by changing the window size (dragging)
3. cache data with timeout of 5 minutes, making sure upon reload the app conditionally uses stored data

**How to get started**

1. Clone this repo, then `npm i` and `npm run start` to start a development app (uses Angular and Service)
2. Use the 2 API calls provided in the Footprint service to get a list of countries and to get emission data per country per year. Do this for all countries. To chart the carbon footprint for a specific year, you need the `carbon` attribute from the response. Note that for some countries data for a specific year is missing.

**Suggestions**

- Consider first defining the data structure that you intend to use to create the chart.
- Use the types defined in `Country.ts` to help you
- Talk about your approach!
