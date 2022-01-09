var DEBUG = true;


// CONFIGURATION ================================================================================================================
var LOG_EVERY_MS = 250;

var VALIDATION_CONSEC_MS = 2500;
var LIVE_TEST_CONSEC_MS = 12500;

var EYE_CLOSE_EYES_CONSEC_MS = 750;
var BLINK_RESPONSE_CYCLE_MS = 2000;
var EYE_AR_THRESH = 0.22;


var CIRCLE_VALIDATION_RADIUS_MOBILE = 500;
var CIRCLE_VALIDATION_RADIUS_PC = 250;
var MINI_CIRCLE_RADIUS_DIVIDER = 2;
// ===============================================================================================================================
// UI ELEMENTS
var CANVAS_INTERACTION;
var CTX_INTERACTION;

// MODEL ELEMENTS
var CUR_FACES = [];
var FACEMESH_MODEL;
var COCOSSD_MODEL;

//VARIABLES FOR FACE POSITION VALIDATION LOGIC
var CIRCLE_VALIDATION_RADIUS = -1;
var VALIDATION_TICK_NUMBER = 0


// VARIABLES FOR BLINK VALIDATION LOGIC 
var LAST_MODEL_LOG = 0;
var BLINKS_COUNTER = 0;
var EAR_COUNTER = 0;
var BLINKS_TEMP_COUNTER = 0;

var BLINK_TEST_TICK_NUMBER = 0;
var BLINK_TEST_INPROGRESS = false;
var TARGET_BLINKS = -1;
var MAX_BLINKS = -1;

var TICK_TARGET_ARRAY;
var BLINK_NUMBER_TEXT = ["PRIMER","SEGUNDO","TERCERO","CUARTO","QUINTO","SEXTO","SEPTIMO","OCTAVO","NOVEMO","DECIMO","DECIMO PRIMERO","DECIMO SEGUNDO",
                        "DECIMO TERCERO","DECIMO CUARTO","DECIMO QUINTO","DECIMO SEXTO","DECIMO SEPTIMO","DECIMO OCTAVO","DECIMO NOVENO" , "VIGESIMO"];

//=========================== Algorithims and Logic

function BlinkTest(data) {
  BLINK_TEST_TICK_NUMBER++;
  var actualTickTarget = TICK_TARGET_ARRAY[BLINK_TEST_TICK_NUMBER];


  // FINISH CONDITION
  if ((BLINK_TEST_TICK_NUMBER * LOG_EVERY_MS) > LIVE_TEST_CONSEC_MS && BLINKS_COUNTER == TARGET_BLINKS) {
    alert("PRUEBA EXITOSA");
    document.getElementById("Log_header").innerHTML = "Manten tu vista firme sin pestañar";
    BLINK_TEST_INPROGRESS = false;
    VALIDATION_TICK_NUMBER = 0;
    BLINKS_TEMP_COUNTER = 0;
    BLINKS_COUNTER = 0;
  }
  else if ((BLINK_TEST_TICK_NUMBER * LOG_EVERY_MS) > LIVE_TEST_CONSEC_MS) {
    alert("PRUEBA FALLIDA. No se logro el target de Pestañeos: "+TARGET_BLINKS);
    document.getElementById("Log_header").innerHTML = "Manten tu vista firme sin pestañar";
    BLINK_TEST_INPROGRESS = false;
    VALIDATION_TICK_NUMBER = 0;
    BLINKS_TEMP_COUNTER = 0;
    BLINKS_COUNTER = 0;
  }




  if (actualTickTarget == 1) {
    //if (DEBUG) console.log("Porfavor realiza el"+ BLINK_NUMBER_TEXT[BLINKS_COUNTER] +" pestañeo de al menos " + (EYE_CLOSE_EYES_CONSEC_MS / 1000) + " secs.");
    document.getElementById("Log_header").innerHTML = "Porfavor realiza el "+ BLINK_NUMBER_TEXT[BLINKS_COUNTER] +" pestañeo de al menos " + (EYE_CLOSE_EYES_CONSEC_MS / 1000) + " secs.";

    CTX_INTERACTION.font = "30px Comic Sans MS";
    CTX_INTERACTION.fillStyle = "red";
    CTX_INTERACTION.textAlign = "center";
    CTX_INTERACTION.fillText("Hello World", CTX_INTERACTION.width/2, CTX_INTERACTION.height/2);
  }
  else {
    //if (DEBUG) console.log("Manten tu vista firme sin pestañar");
    document.getElementById("Log_header").innerHTML = "Manten tu vista firme sin pestañar";
  }


  var LeftEAR = EyeAspectRatioLeft(data);
  var RightEAR = EyeAspectRatioRight(data);

  var TotalEAR = (LeftEAR + RightEAR) / 2.0;

  if (TotalEAR < EYE_AR_THRESH) {
    BLINKS_TEMP_COUNTER++;
  }
  else {
    //if the eyes were closed for a sufficient number of then increment the total number of blinks
    if ((BLINKS_TEMP_COUNTER * LOG_EVERY_MS) >= EYE_CLOSE_EYES_CONSEC_MS) {
      
      


      // VALIDATE OF ACTUAL TICK IS BLINK
      if (actualTickTarget == 1) {
        BLINKS_COUNTER++;
        //if (DEBUG) console.log("Manten tu vista firme sin pestañar");
        if (DEBUG) document.getElementById("BlinkCounter_header").innerHTML = "Total pestañeos: "+BLINKS_COUNTER;
        document.getElementById("Log_header").innerHTML = "Manten tu vista firme sin pestañar";
        
      }
      else {
        alert("PRUEBA FALLIDA. Haz realizado le pe  stañeo a destiempo, vuelve a comenzar la prueba");
        //if (DEBUG) console.log("Haz realizado le pestañeo a destiempo, vuelve a comenzar la prueba");
        if (DEBUG) document.getElementById("BlinkCounter_header").innerHTML = "Total pestañeos: 0";
        document.getElementById("Log_header").innerHTML = "Haz realizado le pestañeo a destiempo, vuelve a comenzar la prueba";
        BLINK_TEST_INPROGRESS = false;
        VALIDATION_TICK_NUMBER = 0;
        BLINKS_TEMP_COUNTER = 0;
        BLINKS_COUNTER = 0;
        return;
      }
      //if (DEBUG) console.log("Total Blinks: " + BLINKS_COUNTER);
      if (DEBUG) document.getElementById("BlinkCounter_header").innerHTML = "Cantidad Pestañeos: " + BLINKS_COUNTER;
    }

    // # reset the eye frame counter
    BLINKS_TEMP_COUNTER = 0;
  }

}

function RunLifeTest(data) {

    var LeftEAR = EyeAspectRatioLeft(data);
    var RightEAR = EyeAspectRatioRight(data);

    var TotalEAR = (LeftEAR + RightEAR) / 2.0;

    EAR_COUNTER = TotalEAR;
    if (DEBUG) document.getElementById("EAR_header").innerHTML = "EAR: " + EAR_COUNTER;

    // Are face Inside Circle Coordinates?
    var Point10Inside = CoordinateInsideCircle(data.scaledMesh[10][0], data.scaledMesh[10][1]);
    var Point234Inside = CoordinateInsideCircle(data.scaledMesh[234][0], data.scaledMesh[234][1]);
    var Point454Inside = CoordinateInsideCircle(data.scaledMesh[454][0], data.scaledMesh[454][1]);
    var Point152Inside = CoordinateInsideCircle(data.scaledMesh[152][0], data.scaledMesh[152][1]);


    /*  FACE VALIDATION  */
    if (Point10Inside &&
      Point234Inside &&
      Point454Inside &&
      Point152Inside
    ) {

      if (DEBUG) document.getElementById("Validation_header").innerHTML = "Cabeza en posicion";


      if (VALIDATION_TICK_NUMBER * LOG_EVERY_MS >= VALIDATION_CONSEC_MS) {
        document.getElementById("Log_header").innerHTML = "Validación Completada";
        //if (DEBUG) console.log("Validación Completada");

        if (!BLINK_TEST_INPROGRESS) {
          BLINK_TEST_TICK_NUMBER = 0;
          BLINKS_COUNTER = 0;
          BLINK_TEST_INPROGRESS = true;
          MAX_BLINKS = Math.floor(LIVE_TEST_CONSEC_MS / BLINK_RESPONSE_CYCLE_MS);
          TARGET_BLINKS = Math.floor(Math.random() * MAX_BLINKS )+ 1;

          //Create the Target Array for the Test
          GenerateTargetAndBlinkTestArray();
        }


        // Run Blink Test
        BlinkTest(data);

      }
      else {
        VALIDATION_TICK_NUMBER++;
        //if (DEBUG) console.log("Mantente en el circulo por" + (VALIDATION_CONSEC_MS - (LOG_EVERY_MS * VALIDATION_TICK_NUMBER)) / 1000 + " secs.");
        document.getElementById("Log_header").innerHTML = "Mantente en el circulo por " + (VALIDATION_CONSEC_MS - (LOG_EVERY_MS * VALIDATION_TICK_NUMBER)) / 1000 + " secs.";
        BLINK_TEST_INPROGRESS = false;
        BLINK_TEST_TICK_NUMBER = 0;
      }
    }
    else {
      if (DEBUG) document.getElementById("Validation_header").innerHTML = "Cabeza no en posicion";
      if (DEBUG) document.getElementById("BlinkCounter_header").innerHTML = "Total pestañeos: " + BLINKS_COUNTER;
      //if (DEBUG) console.log("Validacion Fallida. Intenta de Nuevo");
      document.getElementById("Log_header").innerHTML = "Validacion Fallida. Intenta de Nuevo";
      VALIDATION_TICK_NUMBER = 0;
      BLINKS_COUNTER = 0;
      BLINK_TEST_INPROGRESS = false;

    }

  


}


function GenerateTargetAndBlinkTestArray() {
  TICK_TARGET_ARRAY = new Array(Math.floor(LIVE_TEST_CONSEC_MS / LOG_EVERY_MS)).fill(0);

  var neededTicksForClick = Math.floor(BLINK_RESPONSE_CYCLE_MS / LOG_EVERY_MS);
  var temporalTargetBlinks = 0;

  for (var counter = 0; counter < TARGET_BLINKS; counter++) {
    var tryPosition = Math.floor(Math.random() * (Math.floor(LIVE_TEST_CONSEC_MS / LOG_EVERY_MS) - neededTicksForClick)-1);

    if (TICK_TARGET_ARRAY[tryPosition] == 0 && TICK_TARGET_ARRAY[tryPosition + neededTicksForClick] == 0) {
      TICK_TARGET_ARRAY.fill(1, tryPosition, tryPosition + neededTicksForClick);
      temporalTargetBlinks++;
    }

  }
  TARGET_BLINKS = temporalTargetBlinks;
}


function IsMobile() {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

function CoordinateInsideCircle(x_percentage, y_percentage) {

  var x = x_percentage;// * video.offsetWidth;
  var y = y_percentage;// * video.offsetHeight;

  var circle_center_x = CANVAS_INTERACTION.offsetWidth / 2;
  var circle_center_y = CANVAS_INTERACTION.offsetHeight / 2;

  var totalRadius = CIRCLE_VALIDATION_RADIUS * CIRCLE_VALIDATION_RADIUS;
  var totalRadiusMiniCirle = (CIRCLE_VALIDATION_RADIUS / MINI_CIRCLE_RADIUS_DIVIDER) * (CIRCLE_VALIDATION_RADIUS / MINI_CIRCLE_RADIUS_DIVIDER);

  var xVariable = ((x) - circle_center_x) * ((x) - circle_center_x);
  var yVariable = ((y) - circle_center_y) * ((y) - circle_center_y);

  //if (xVariable + yVariable <= totalRadius && totalRadiusMiniCirle <= xVariable + yVariable)
  if (xVariable + yVariable <= totalRadius )
    return true;
  else
    return false;
}
function EuclideanDistance(a, b) {
  var arrayA = [a[0], a[1]];
  var arrayB = [b[0], b[1]];

  return arrayA
    .map((x, i) => Math.abs(x - arrayB[i]) ** 2)
    .reduce((sum, now) => sum + now)
    ** (1 / 2)
}

function EyeAspectRatioLeft(allData) {
  A = EuclideanDistance(allData.scaledMesh[390], allData.scaledMesh[388]);
  B = EuclideanDistance(allData.scaledMesh[380], allData.scaledMesh[385]);


  C = EuclideanDistance(allData.scaledMesh[263], allData.scaledMesh[362]);

  ear = (A + B) / (2.0 * C)
  return ear;
}

function EyeAspectRatioRight(allData) {
  A = EuclideanDistance(allData.scaledMesh[163], allData.scaledMesh[161]);
  B = EuclideanDistance(allData.scaledMesh[153], allData.scaledMesh[158]);


  C = EuclideanDistance(allData.scaledMesh[33], allData.scaledMesh[133]);

  ear = (A + B) / (2.0 * C)
  return ear;
}


//======= Video and Facemesh ================================================================================ 
async function setupCamera() {
  video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}



async function renderPrediction() {
  if (Date.now() - LAST_MODEL_LOG > LOG_EVERY_MS) {
    LAST_MODEL_LOG = Date.now();
    //now = performance.now();

    const facepred = await FACEMESH_MODEL.estimateFaces(video);


    //if (DEBUG) document.getElementById("perf").innerHTML = "FPS: " + Number(1 / (.001 * (performance.now() - now))).toFixed(1);

    if (facepred.length > 0) { // If we find a face, process it
      CUR_FACES = facepred;
      RunLifeTest(CUR_FACES[0]);
    }
  }
    requestAnimationFrame(renderPrediction);
  
};



async function drawVideo() {
  CTX_INTERACTION.drawImage(video, 0, 0);
  if(CUR_FACES[0] != null && CUR_FACES[0].faceInViewConfidence > .95)
  {
    drawFaceAndCenter(CUR_FACES[0]);
  }
  //for (face of CUR_FACES) {
    //if (face.faceInViewConfidence > .95) {
      //drawFaceAndCenter(face);
    //}
  //}
  requestAnimationFrame(drawVideo);
}

// Draws the current eyes onto the canvas, directly from video streams
async function drawFaceAndCenter(face) {
  CTX_INTERACTION.fillStyle = 'cyan';
  for (pt of face.scaledMesh) {
    CTX_INTERACTION.beginPath();
    if (DEBUG) CTX_INTERACTION.ellipse(pt[0], pt[1], 3, 3, 0, 0, 2 * Math.PI)
    if (DEBUG) CTX_INTERACTION.fill();
  }
  var centerX = CANVAS_INTERACTION.width / 2;
  var centerY = CANVAS_INTERACTION.height / 2;

  CTX_INTERACTION.arc(centerX, centerY, CIRCLE_VALIDATION_RADIUS, 0, 2 * Math.PI, false);
  //CTX_INTERACTION.arc(centerX, centerY, CIRCLE_VALIDATION_RADIUS / MINI_CIRCLE_RADIUS_DIVIDER, 0, 2 * Math.PI, false);

  CTX_INTERACTION.lineWidth = 5;
  CTX_INTERACTION.strokeStyle = '#003300';
  CTX_INTERACTION.stroke();
}



async function main() {

  if (IsMobile()) {
    CIRCLE_VALIDATION_RADIUS = CIRCLE_VALIDATION_RADIUS_MOBILE;
  }
  else {
    CIRCLE_VALIDATION_RADIUS = CIRCLE_VALIDATION_RADIUS_PC;
  }

  //await tf.setBackend('wasm');  // In case you want to use WASM option.
  await tf.setBackend('webgl');  // In case you want to use WASM option.
  await tf.ready();
  FACEMESH_MODEL = await facemesh.load({detectionConfidence:0.9, maxFaces:1});
  

  // Set up front-facing camera
  await setupCamera();
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.play()
  
  // HTML Canvas for the video feed
  CANVAS_INTERACTION = document.getElementById('facecanvas');
  CANVAS_INTERACTION.width = videoWidth;
  CANVAS_INTERACTION.height = videoHeight;
  CTX_INTERACTION = CANVAS_INTERACTION.getContext('2d');
  CTX_INTERACTION.translate(videoWidth, 0);
  CTX_INTERACTION.scale(-1, 1);


  
  drawVideo()
  renderPrediction();
}


