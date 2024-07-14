
export const Physics = {};

Physics.AU = 149597870700;
Physics.G = 6.6743e-11;
Physics.C = 299792458;
Physics.g = 9.807;

Physics.EARTH_RADIUS = 6371000;
Physics.EARTH_DENSITY = 5.51;
Physics.EARTH_MASS = 5.972e24;
Physics.JUPITER_MASS = 1.898e27;
Physics.SOL_MASS = 1.989e30;
Physics.SOL_RADIUS = 696340000;
Physics.MOON_DENSITY = 3.34;
Physics.JUPITER_DENSITY = 1.33;
Physics.JUPITER_RADIUS = 69911000;
Physics.SOL_DENSITY = 1.41;
Physics.STANDARD_DAY = 86400;
Physics.STANDARD_YEAR = Physics.STANDARD_DAY * 365;

Physics.getNumber = function(number) {
  if (!number || number === "") {
    return 0;
  }
  return parseFloat(number.replace(/[^0-9.\-]/g, ""));
};

Physics.getThrust = function (thrust) {
  if (!thrust || thrust === "") {
    return Physics.g;
  }
  if ((""+thrust).match(/^[0-9.\-]+$/)) {
    return parseFloat(thrust);
  }
  thrust = ("" + thrust).toLowerCase();
  let number = parseFloat(thrust.replace(/[^0-9.\-]/g, ""));

  if (thrust.match("g$")) {
    number *= Physics.g;
  }

  return parseFloat(number);
};



// Returns a float, always in metres. Assumes given in km unless otherwise specified
Physics.getDistance = function (distance) {
  if (!distance || distance === "") {
    return Physics.EARTH_RADIUS;
  }
  if ((""+distance).match(/^[0-9.\-]+$/)) {
    return parseFloat(distance) * 1000;
  }
  distance = ("" + distance).toLowerCase();
  let number = parseFloat(distance.replace(/[^0-9.\-]/g, ""));

  if (distance.match("mkm$")) {
    number *= 1000000000;
  } else if (distance.match("km$")) {
    number *= 1000;
  } else if (distance.match("m$")) {
    number *= 1;
  } else if (distance.match("au$")) {
    number *= Physics.AU;
  } else if (distance.match("ly$")) {
    number *= Physics.C * 86400 * 365.25;
  } else if (distance.match("pc$")) {
    number *= Physics.C * 86400 * 365.25 * 3.2616;
  } else if (distance.match("j$")) {
    number *= Physics.JUPITER_RADIUS;
  } else if (distance.match("e$")) {
    number *= Physics.EARTH_RADIUS;
  } else if (distance.match("ed$")) {
    number *= Physics.EARTH_RADIUS * 2;
  } else if (distance.match("sol$")) {
    number *= Physics.SOL_RADIUS;
  }

  return parseFloat(number);
};

// Returns a float, always in metres.
Physics.getDensity = function (density) {
  if (!density || density === "") {
    return Physics.EARTH_DENSITY;
  }
  if ((""+density).match(/^[0-9.\-]+$/)) {
    return parseFloat(density);
  }
  density = ("" + density).toLowerCase();
  let number = parseFloat(density.replace(/[^0-9.\-]/g, ""));

  if (density.match("e$")) {
    number *= Physics.EARTH_DENSITY;
  } else if (density.match("m$")) {
    number *= Physics.MOON_DENSITY;
  } else if (density.match("j$")) {
    number *= Physics.JUPITER_DENSITY;
  } else if (density.match("sol$")) {
    number *= Physics.SOL_DENSITY;
  }

  return parseFloat(number);
};

Physics.printNumber = function (number, precision) {
  number = parseFloat(number);
  if (precision === null || precision === undefined || precision < 0) {
    precision = 2;
  }

  if (number > 1e12 || number < 1e-3) {
    return number.toExponential(precision);
  } else if (number > 99) {
    return Number(parseInt(number)).toLocaleString();
  } else {
    return number.toPrecision(precision);
  }
};

// Takes time in seconds.
Physics.printTime = function (number) {
  let time = "";
  let count = 0;

  if (number > Physics.STANDARD_YEAR * 100) {
    count++;
  }

  if (number > Physics.STANDARD_YEAR * 10) {
    count++;
  }

  if (number >= Physics.STANDARD_YEAR) {
    let years = parseInt (number / Physics.STANDARD_YEAR);
    if (years > 100) {
      time += Physics.printNumber(years) + "y ";
    } else {
      time += years + "y ";
    }
    number %= Physics.STANDARD_YEAR;
    count++;
  }
  if (count > 0 || number >= Physics.STANDARD_DAY) {
    let days = parseInt(number / Physics.STANDARD_DAY);
    if (days > 100) {
      time += Physics.printNumber(days) + "d ";
    } else {
      time += days + "d ";
    }
    number %= Physics.STANDARD_DAY;
    count++;
  }
  if (count > 2) return time;

  if (count > 0 || number >= 3600) {
    time += parseInt(number / 3600) + "h ";
    number %= 3600;
    count++;
  }
  if (count > 2) return time;

  if (count > 0 || number >= 60) {
    time += parseInt( number / 60) + "m ";
    number %= 60;
    count++;
  }
  if (count > 2) return time;

  if (time === "") {
    time += Physics.printNumber(number) + "s";
  } else {
    time += parseInt(number) + "s";
  }

  return time;
};

// Takes a distance in metres.
Physics.printDistance = function (number) {
  number = parseInt(number);

  let units = "m";
  if (number > Physics.AU * 2) {
    units = "AU";
    number = (1.0 * number) / Physics.AU;
  } else if (number > 2_000_000_000) {
    units = "Mkm";
    number = (1.0 * number) / 1_000_000_000;
  } else if (number >= 10_000) {
    units = "km";
    number = number / 1_000;
  }

  return Physics.printNumber(number) + units;
};

Physics.printVelocity = function(title, velocity) {
  let text = "";

  text += `<b>${title}</b>: ${Physics.printNumber(velocity / 1000)}km/s`;
  if (velocity >= Physics.C) {
    text += " <i>(!)</i><br/>";
  } else if (velocity > Physics.C / 10) {
    text += ` (${(velocity / Physics.C).toFixed(2)}c)<br/>`;
    let td = Math.sqrt( 1 - (velocity * velocity) / (Physics.C * Physics.C));
    text += `<b>Time dilation</b>: ${td.toFixed(3)}<br/>`;
  } else {
    text += "<br/>";
  }

  return text;
};

Physics.help = function(chatData) {
  let text = `<div class="physics">`;
  text += `<h2>Physics Commands</h2>`;

  text += `planet [radius] [density]<br/>`;
  text += `planet [radius] [density] [orbit]<br/>`;
  text += `thrust [g] [distance]<br/>`;
  text += `ethrust [g] [distance]<br/>`;
  text += `rocket [wet-mass] [dry-mass] [isp]<br/>`;
  text += `</div>`;

  chatData.content = text;
  ChatMessage.create(chatData);
};

Physics.planetCommand = function(chatData, args) {
  let text = `<div class="physics">`;
  text += `<h3>Planet Data</h3>`;

  if (args.length < 2) {
    return;
  }

  let radius = Physics.getDistance(args.shift());
  let density = Physics.getDensity(args.shift());

  let mass = 4.0/3.0 * Math.PI * radius * radius * radius * density * 1000;
  let g = mass * Physics.G / (radius * radius);
  let ev = Math.sqrt(mass * Physics.G * 2 / radius);

  text += `<b>Radius</b>: ${Physics.printNumber(radius / 1000)}km<br/>`;
  text += `<b>Density</b>: ${Physics.printNumber(density)}g/cm³<br/>`;
  text += `<b>Mass</b>: ${Physics.printNumber(mass)}kg<br/>`;
  if (mass > Physics.SOL_MASS / 10) {
    text += `&nbsp;<i><b>Mass</b>: ${Physics.printNumber(mass / Physics.SOL_MASS)} Sols</i><br/>`;
  }
  if (mass > Physics.JUPITER_MASS / 10 && mass < Physics.JUPITER_MASS * 200) {
    text += `&nbsp;<i><b>Mass</b>: ${Physics.printNumber(mass / Physics.JUPITER_MASS)} Jupiters</i><br/>`;
  }
  if (mass > Physics.EARTH_MASS / 100 && mass < Physics.EARTH_MASS * 200) {
    text += `&nbsp;<i><b>Mass</b>: ${Physics.printNumber(mass / Physics.EARTH_MASS)} Earths</i><br/>`;
  }
  // Escape velocity
  if (ev >= Physics.C) {
    text += `<i><b>Escape Velocity</b>: No escape.</i><br/>`;
  } else {
    text += `<b>Escape Velocity</b>: ${Physics.printNumber(ev)}m/s<br/>`;
    if (ev > Physics.C / 100) {
      text += `&nbsp;<i><b>Escape Velocity</b>: ${Physics.printNumber(ev / Physics.C)}c</i><br/>`;
    }
    text += `<b>Surface Gravity</b>: ${Physics.printNumber(g)}m/s²<br/>`;
    if (g > 0.1) {
      text += `&nbsp;<i><b>Surface Gravity</b>: ${Physics.printNumber(g / Physics.g)}g</i><br/>`;
    }
  }

  if (args.length > 0) {
    let value = args.shift();
    let orbit = Physics.getDistance(value);
    if (value.startsWith("+")) {
      orbit += radius;
    }
    let velocity = Math.sqrt(Physics.G * mass / orbit);
    let circumference = 2 * Math.PI * orbit;
    let time = circumference / velocity;
    let evo = Math.sqrt(mass * Physics.G * 2 / orbit);
    let og = mass * Physics.G / (orbit * orbit);

    let orbitDistance = Physics.printNumber(orbit / 1000) + "km";
    if (orbit > Physics.AU * 2) {
      orbitDistance = Physics.printNumber(orbit / Physics.AU) + "AU";
    } else if (orbit > 10000000000) {
      orbitDistance = Physics.printNumber(orbit / 1000000000) + "Mkm";
    } else if (orbit > 100000000) {
      orbitDistance = Physics.printNumber(orbit / 1000000) + "Kkm";
    }

    text += `<br/><h3>${orbitDistance} orbit</h3>`;

    if (evo >= Physics.C) {
      text += `<i>No orbits possible</i><br/>`;
    } else {
      text += `<b>Orbit Velocity</b>: ${Physics.printNumber(velocity)}m/s<br/>`;
      text += `<b>Orbit Period</b>: ${Physics.printTime(time)}<br/>`;
      text += `<b>Escape Velocity</b>: ${Physics.printNumber(evo)}m/s<br/>`;
      if (evo > Physics.C / 100) {
        text += `&nbsp;<i><b>Escape Velocity</b>: ${Physics.printNumber(evo / Physics.C)}c</i><br/>`;
      }
      text += `<b>Gravity</b>: ${Physics.printNumber(og)}m/s²<br/>`;
      if (og > 0.1) {
        text += `&nbsp;<i><b>Gravity</b>: ${Physics.printNumber(og / Physics.g)}g</i><br/>`;
      }
    }
  }


  text += `</div>`;

  chatData.content = text;
  ChatMessage.create(chatData);

};

Physics.thrustCommand = function(chatData, args) {
  let text = `<div class="physics">`;
  text += `<h3>Travel Times</h3>`;

  if (args.length < 2) {
    return;
  }

  let thrust = Physics.getThrust(args.shift());
  let distance = Physics.getDistance(args.shift());

  let time = parseInt(2 * Math.sqrt(distance / thrust ));
  let maxv = thrust * time / 2;

  text += `<b>Thrust</b>: ${Physics.printNumber(thrust)}m/s² (${Physics.printNumber(thrust / Physics.g)}g) <br/>`;
  text += `<b>Distance</b>: ${Physics.printDistance(distance)}<br/>`;

  text += `<b>Time</b>: ${Physics.printTime(time)}<br/>`;
  text += Physics.printVelocity("Max Velocity", maxv);

  // But what if we don't want to stop, and just thrust until impact?
  time = parseInt(Math.sqrt(2 * distance / thrust));
  maxv = thrust * time;

  text += "<br/>";
  text += `<b>Time to impact</b>: ${Physics.printTime(time)}<br/>`;
  text += Physics.printVelocity("Velocity to impact", maxv);

  text += `</div>`;

  chatData.content = text;
  ChatMessage.create(chatData);
};

Physics.eThrustCommand = function(chatData, args) {
  let text = `<div class="physics">`;
  text += `<h3>Travel Times</h3>`;

  if (args.length < 2) {
    return;
  }

  let thrust = Physics.getThrust(args.shift());
  let distance = Physics.getDistance(args.shift());


  let f = Math.acosh( 1 + (thrust / 2) * distance / Math.pow(Physics.C,2 ));
  // Passage of time as perceived by the ship
  let shipTime = parseInt ( 2 * ( Physics.C / thrust) * f);
  // Passage of time as perceived by the outside universe
  let restTime = parseInt(2 * ( Physics.C / thrust) * Math.sinh(f));


  //let maxv = thrust * time / 2;

  text += `<b>Thrust</b>: ${Physics.printNumber(thrust)}m/s² (${Physics.printNumber(thrust / Physics.g)}g) <br/>`;
  text += `<b>Distance</b>: ${Physics.printDistance(distance)}<br/>`;

  text += `<b>Time</b>: ${Physics.printTime(restTime)}<br/>`;
  if (restTime * 0.999 > shipTime) {
    text += `<b>Ship Time</b>: ${Physics.printTime(shipTime)}<br/>`;
  }


  f = Math.acosh( 1 + (thrust) * distance / Math.pow(Physics.C,2 ));
  // Passage of time as perceived by the ship
  shipTime = parseInt ( ( Physics.C / thrust) * f);
  // Passage of time as perceived by the outside universe
  restTime = parseInt(( Physics.C / thrust) * Math.sinh(f));
  text += "<br/>";
  text += `<b>Time to impact</b>: ${Physics.printTime(restTime)}<br/>`;
  if (restTime * 0.999 > shipTime) {
    text += `<b>Ship Time to impact</b>: ${Physics.printTime(shipTime)}<br/>`;
  }

  text += `</div>`;
  chatData.content = text;
  ChatMessage.create(chatData);
};

Physics.rocketCommand = function(chatData, args) {
  let text = `<div class="physics">`;
  text += `<h3>Rocket Equation</h3>`;

  if (args.length < 3) {
    return;
  }
  let wet = Physics.getNumber(args.shift());
  let dry = Physics.getNumber(args.shift());
  let isp = Physics.getNumber(args.shift());

  if (dry <= 0 || wet <= 0 || isp <= 0) {
    chatData.content = text + "Invalid values</div>";
    ChatMessage.create(chatData);
    return;
  }
  let ratio = wet / dry;
  let log = Math.log(ratio);
  let deltaVee = log * isp * Physics.g;

  text += `<b>Wet Mass</b>: ${wet.toLocaleString()}<br/>`;
  text += `<b>Dry Mass</b>: ${dry.toLocaleString()}<br/>`;
  text += `<b>Mass Ratio</b>: ${Physics.printNumber(ratio)}<br/>`;
  text += `<b>I<sub>sp</sub></b>: ${Physics.printNumber(isp)}<br/>`;
  if (deltaVee >= 10000) {
    text += `<b>Δv</b>: ${Number((deltaVee / 1000.0).toPrecision(4)).toLocaleString()} kms<sup>-1</sup><br/>`;
  } else {
    text += `<b>Δv</b>: ${Physics.printNumber(deltaVee)} ms<sup>-1</sup><br/>`;
  }

  text += `</div>`;
  chatData.content = text;
  ChatMessage.create(chatData);
};

// Just a test of web apis.
Physics.getSector = function(chatData, args) {
  if (args.length < 1) {
    return;
  }

  let id = parseInt(args.shift());

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", "/wgapi/sectors/" + id, false);
  xmlHttp.send();

  let response = xmlHttp.responseText;

  let obj = JSON.parse(response);

  chatData.content = "Sector is " + obj.name;
  ChatMessage.create(chatData);

}

