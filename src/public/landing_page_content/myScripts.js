
// set height of sections
function setHeight() {

    var h = window.innerHeight;
    var x = document.getElementById("heroSection");
    x.style.height = h + "px";
    
    // position logo vertically on top of hero image
    var x = h * 0.5;
    var y = document.getElementById('heroText').clientHeight;
    var pos = Math.round((h - y)/3);
    
    document.getElementById('heroText').style.top = pos +"px";
}

// close cookies modal
function closeCookies() {
    document.getElementById('cookiesModal').style.display = 'none'; 
}