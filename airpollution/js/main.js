let rendererHeight;
let rendererWidth;
let renderer;
let data;
let selectedCountry;
let infoCountry = $("#info-1");
let infoPopulation = $("#info-2");
let infoGDP = $("#info-3");
let infoDeaths = $("#info-4");
let infoIndoor = $("#info-5");
let infoOutdoor = $("#info-6");
let ratioScale = chroma.scale(["#00FFFF", "#56FF61", "#FFEA00"]);

let currentYear = 1990;

$(function setup() {
  renderer = $("#renderer");
  rendererHeight = renderer.innerHeight();
  rendererWidth = renderer.innerWidth();
  prepareData();
  draw();
  const gradientRectangle = $('<div id="gradient-rectangle"></div>');
  $("body").append(gradientRectangle);

  $("#slider").slider({
    min: 1990,
    max: 2019,
    value: 2005,
    create: function (event, ui) {
      $(".ui-slider-handle").text($(this).slider("value"));
      const year = $(this).slider("value");
      currentYear = year;
      $(".circle[data-year='" + year + "']").show();
    },
    slide: function (event, ui) {
      $(".ui-slider-handle").text(ui.value);

      const year = ui.value;
      currentYear = year;
      $(".circle").hide();
      $(".circle[data-year='" + year + "']").show();
      let selectedCountry = $(".circle.clicked").first().attr("data-country");
      let selectedElement = $(".circle[data-year='" + year + "'][data-country='" + selectedCountry + "']");
      fillClickModal(selectedCountry);

      //console.log(selectedElement.attr("data-deathTotal"), selectedElement.attr("data-gdp"), selectedElement.attr("data-population"), selectedElement.attr("data-country"), selectedElement.attr("data-indoor"), selectedElement.attr("data-outdoor"));
    },
  });
});

function prepareData() {
  data = gmynd.mergeData(countryData, deathrateData, ["alpha3Code", "Year"]);

  data.forEach(function (country) {
    // calculate ratio of indoor to outdoor air pollution
    const indoor = country.indoorAirPollution;
    const outdoor = country.outdoorAirPollution;
    const ratio = indoor / (indoor + outdoor);
    country.airPollutionRatio = ratio;
  });
}

function draw() {
  const gdpMax = gmynd.dataMax(data, "GDP");
  const gdpMin = gmynd.dataMin(data, "GDP");
  const deathMax = gmynd.dataMax(data, "airPollutionTotal");
  const deathMin = gmynd.dataMin(data, "airPollutionTotal");

  for (let i = 0; i < data.length; i++) {
    const circle = $('<div class="circle"></div>');
    const country = data[i];
    const gdp = country.GDP;
    const pop = country.Population;
    const death = country.airPollutionTotal;
    const x = gmynd.map(gdp, gdpMin, gdpMax, 0, rendererWidth);
    const y = gmynd.map(death, deathMin, deathMax, 0, rendererHeight);
    const radius = gmynd.map(pop, 2000000, 800000000, 10, 40);
    const color = ratioScale(country.airPollutionRatio).hex();

    circle.css({
      left: x,
      bottom: y,
      width: radius,
      height: radius,
      "background-color": color,
    });

    circle.attr("data-year", country.Year);
    circle.attr("data-deathTotal", country.airPollutionTotal);
    circle.attr("data-gdp", country.GDP);
    circle.attr("data-population", country.Population);
    circle.attr("data-country", country.country);
    circle.attr("data-indoor", country.indoorAirPollution);
    circle.attr("data-outdoor", country.outdoorAirPollution);

    circle.hover(
      function () {
        const outdoorAirPollution = parseFloat($(this).attr("data-outdoor"));
        const blueSize = gmynd.map(outdoorAirPollution, 0, 100, 10, 50);
        const ellipse = $('<div class="ellipse outdoor"></div>');
        ellipse.css({
          left: 100,
          top: 500,
          width: blueSize,
          height: blueSize,
        });
        ellipse.addClass("blue");
        $("#ellipsesContainer").append(ellipse);

        const indoorAirPollution = parseFloat($(this).attr("data-indoor"));
        const yellowSize = gmynd.map(indoorAirPollution, 0, 100, 10, 50);
        const ellipseY = $('<div class="ellipse indoor"></div>');
        ellipseY.css({
          left: 200,
          top: 500,
          width: yellowSize,
          height: yellowSize,
        });
        ellipseY.addClass("yellow");
        $("#ellipsesContainer").append(ellipseY);

        if (!$(this).hasClass("clicked")) {
          $(this)
            .stop()
            .animate(
              {
                width: radius + 15,
                height: radius + 15,
              },
              200
            );
        }

        fillHoverModal(country);
      },
      function () {
        $(this)
          .stop()
          .animate(
            {
              width: $(this).hasClass("clicked") ? radius + 15 : radius,
              height: $(this).hasClass("clicked") ? radius + 15 : radius,
            },
            200,
            function () {
              $(".ellipse").remove();
              $(".button").remove();
            }
          );

        resetModal();
      }
    );

    circle.click(function () {
      const currentColor = $(this).css("background-color");

      $(".circle").removeClass("clicked");
      if (currentColor === "rgb(255, 255, 255)") {
        $(this).css("background-color", color);
      } else {
        $(this).css({
          width: radius + 15,
          height: radius + 15,
        });

        $(this).addClass("clicked");
        $(".circle[data-country='" + country.country + "']").addClass("clicked");
        fillClickModal(country.country);
      }
    });

    renderer.append(circle);
  }
  $(".circle[data-year!='2005']").hide();
}

function fillHoverModal(country) {
  const { country: c, Population, GDP, airPollutionTotal, indoorAirPollution, outdoorAirPollution } = country;
  infoCountry.text(c);
  infoPopulation.text(Population);
  infoGDP.text(GDP);
  infoDeaths.text(airPollutionTotal);
  infoIndoor.text(indoorAirPollution);
  infoOutdoor.text(outdoorAirPollution);
}

function fillClickModal(selectedCountry) {
  let selectedElement = $(".circle.clicked[data-year='" + currentYear + "']").first();
  infoCountry.text(selectedElement.attr("data-country"));
  infoPopulation.text(selectedElement.attr("data-population"));
  infoGDP.text(selectedElement.attr("data-gdp"));
  infoDeaths.text(selectedElement.attr("data-deathTotal"));
  infoIndoor.text(selectedElement.attr("data-indoor"));
  infoOutdoor.text(selectedElement.attr("data-outdoor"));
}

function resetModal() {
  infoCountry.text("");
  infoPopulation.text("");
  infoGDP.text("");
  infoDeaths.text("");
  infoIndoor.text("");
  infoOutdoor.text("");

  if ($(".circle.clicked").length > 0) {
    fillClickModal();
  }
}
