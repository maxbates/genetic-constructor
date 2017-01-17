
// set height of sections
function setHeight() {
  const h = window.innerHeight;
  var x = document.getElementById('heroSection');
  x.style.height = `${h}px`;

    // set 'interface' section
  var x = document.getElementById('interfaceSection');
  var xh = document.getElementById('interfaceContainer').offsetHeight;

  if (xh + 200 > h || h > 1000) {
    x.style.height = `${xh + 200}px`;
  } else {
    x.style.height = `${h}px`;
  }

    // set 'feature' section
  var x = document.getElementById('featureSection');
  var xh = document.getElementById('featureContainer').offsetHeight;

  if (xh + 200 > h || h > 1000) {
    x.style.height = `${xh + 200}px`;
  } else {
    x.style.height = `${h}px`;
  }

    // set 'try' section
  var x = document.getElementById('trySection');
  var xh = document.getElementById('tryContainer').offsetHeight;

  if (xh + 200 > h || h > 1000) {
    x.style.height = `${xh + 200}px`;
  } else {
    x.style.height = `${h}px`;
  }

    // position logo vertically on top of hero image
  var x = h * 0.5;
  const y = document.getElementById('heroText').clientHeight;
  const pos = Math.round((h - y) / 2);
  document.getElementById('heroText').style.top = `${pos}px`;
}
