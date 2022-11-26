

// Model
let op = {
    newValFlg: false,
    previousOperator: null,
    operator: null,
    total: null,
    term: null,
    storageId: null,
    storageCtr: 0
}

const operators = {
    'add': '+',
    'subtract': '-',
    'multiply': '×',
    'divide': '÷',
    'total': '=',
    'percent': '%',
    'plus-minus': '±'
};

const isConversion = {
    'percent': true,
    'plus-minus': true
};

// View
const newNumber = document.getElementById('newNumber');
const digits = Array.from(document.querySelectorAll('.digit'));
const tape = document.querySelector('.tape');
const entries = document.querySelector('.entries');
const txtDownload = document.getElementById("text-download")
// button
const btnClearEntry = document.getElementById('clear-entry');
const btnClear = document.getElementById('clear');
const btnClearTape = document.getElementById('clear-tape');
const btnSave = document.getElementById('save-tape');
const btnPrev = document.getElementById('prev-tape');

let lineEntry = () => (
    `<li><span>${operators[op.previousOperator] || ''}</span><span>${op.term}</span></li>`)

let totalEntry = () => {
    let classes = 'tape_total: ' + op.total;
    return `<li class='${classes}'><span>=</span><span>${op.total}</span></li>`
}

let clearValueEntry = () => (
    `<li class="blue"><span>#</span><span>Clear</span></li>`)

const lxPrefix = "LXVAD-";

// Controller
function performCacl(optSign, x, y) {
    let res = 0;
    switch (optSign) {
        case "add":
            res = x + y;
            break;
        case "subtract":
            res = x - y;
            break;
        case "multiply":
            res = x * y;
            break;
        case "divide":
            res = x / y;
            break;
        case "total":
            res = x;
            break;
        case "percent":
            res = x / 100;
            break;
        case "plus-minus":
            res = x * -1
            break;
    }

    if (!isConversion[op.operator])
        setLocatStorage(optSign, y, res);
   
    return res;
}

function clearDisplay(clearTape = false, clearStorage = false) {
    op.term = 0;
    op.total = 0;
    op.previousOperator = null;

    entries.innerHTML = clearTape
        ? ''
        : entries.innerHTML + clearValueEntry();
    newNumber.value = '';
    tape.scrollTop = tape.scrollHeight;

    if (clearStorage) {
        removeLocalStorageData(op.storageId);
        op.storageId = null;
        return;
    }
    
    if (!clearTape)
        setLocatStorage("clear", 0, 0);
}

function showDigit(digit) {
    if (op.newValFlg) {
        // replace value
        newNumber.value = digit;
    }
    else {
        // concat value
        newNumber.value = newNumber.value
            .concat(digit)
            .replace(/^0+([123456789])$/, '$1')
            .replace(/[.,$%]/g, (match, offset, all) =>
                match === '.' ? (all.indexOf('.') === offset ? '.' : '') : '');
    }
    op.newValFlg = false
}

function calculate(key) {

    if (op.newValFlg && key != "total") {
        op.previousOperator = key;// Allow to change current operator when number is not changed yet
        return;
    }

    op.newValFlg = true;
    op.term = +newNumber.value;
    op.operator = key;

    //let conversions = ['percent', 'plus-minus'];
    if (isConversion[op.operator]) {
        newNumber.value = performCacl(op.operator, +newNumber.value);
        return;
    };

    if (op.previousOperator) {
        // With Previous Digit
        op.total = performCacl(op.previousOperator, op.total, op.term);
    }
    else {
        // Initial Input
        op.total = op.term;
        setLocatStorage("", op.total, op.total);
    }

    let total = op.total
    entries.innerHTML += lineEntry();
    op.previousOperator = op.operator;// pass new Operator

    onTotalClicked();

    newNumber.value = total;
    tape.scrollTop = tape.scrollHeight;
}

function onTotalClicked() {
    if (op.previousOperator === 'total') { //when NEW OPERATOR IS TOTAL (=)
        entries.innerHTML += totalEntry();
        setLocatStorage(op.previousOperator, op.total, op.total);

        op.operator = null;
        op.previousOperator = null;
        op.total = null;
    }
}

// initialize
function init() {
    try {
        digits.forEach(digit => digit.onclick = e => showDigit(e.target.innerText))
        btnClear.onclick = (e) => clearDisplay();
        btnClearEntry.onclick = (e) => clearEntry();
        btnClearTape.onclick = () => clearDisplay(true, true);

        btnSave.onclick = () => downloadAsTextFile();
        btnPrev.onclick = () => getPrevLocalStorage();

        Array.from(document.querySelectorAll('.calculate'))
            .forEach(btn => btn.onclick = e => calculate(e.target.id));

        Array.from(document.querySelectorAll('.inputs span'))
            .forEach(btn => {
                btn.classList.add('hvr-sink')
                btn.addEventListener('click', () => {
                    btn.classList.add('hvr-sink-active')
                })
                btn.addEventListener('animationend', () => {
                    btn.classList.remove('hvr-sink-active')
                })
            });

        window.addEventListener('keypress', e => {
            let digitKey = '0123456789.'.includes(e.key)
            let calcKey = '^%+-=*/ps'.includes(e.key)
            if (digitKey) {
                showDigit(e.key)
            } else if (calcKey) {
                switch (e.key) {
                    case '*':
                        calculate('multiply')
                        break
                    case '/':
                        calculate('divide')
                        break
                    case 'p':
                        calculate('plus-minus')
                        break
                    case 's':
                        calculate('square_root')
                        break
                    default:
                        calculate(Object.entries(operators).filter(obj => obj[1] === e.key)[0][0])
                }
            }
        })
    } catch (e) {
        console.log(e)
    }
}

// local storage
function setLocatStorage(opSign, newVal, subTotal) {

    if (!op.storageId) {
        op.storageId = lxPrefix + Date.now();
        op.storageCtr = 0;
    }

    op.storageCtr++;
    let strgId = op.storageId + "|" + op.storageCtr.toString().padStart(5, '0');
    let strgData = "";
    if (opSign == "clear") {
        strgData = opSign + "|" + 0 + "|" + 0;
    }
    else {
        strgData = opSign + "|" + newVal + "|" + subTotal; 
    }

    localStorage.setItem(strgId, strgData);
}

function removeLocalStorageData() {
    if (op.storageId) {
        let lclLength = localStorage.length;

        for (let i = lclLength - 1; i >= 0; i--) {
            let strgId = localStorage.key(i).toString();

            if (strgId.includes(op.storageId))
                localStorage.removeItem(strgId);
        }
    }
}

// since Local Storage is NOT sorted
function sortLocalStorage(storageId) {
    let localStorageArray = new Array();
    if (localStorage.length > 0) {
        let ctr = 0;
        for (let i = 0; i < localStorage.length; i++) {
            let strgId = localStorage.key(i).toString();
            if (!strgId.includes(lxPrefix) || (storageId && !strgId.includes(storageId)))
                continue;

            localStorageArray[ctr] = strgId + "|" + localStorage.getItem(strgId);
            ctr++;
        }
    }

    return localStorageArray.sort();
}

function getPrevLocalStorage() {

    let sortedLocalStorage = sortLocalStorage();
    let lclLength = sortedLocalStorage.length;
    if (lclLength < 1)
        return;

    clearDisplay(true);// clear the Tape but not the storage

    let tempHTML = entries.innerHTML;
    for (let i = lclLength - 1; i >= 0; i--) {

        let strgId = sortedLocalStorage[i].toString();

        if (op.storageId && !strgId.includes(op.storageId))
            break; // exit loop since not the most recent history

        let arrSplit = strgId.split("|");
        if (!op.storageId) {
            op.storageId = arrSplit[0].toString();
            op.storageCtr = +arrSplit[1];
        }

        op.previousOperator = arrSplit[2]; // operator
        op.term = +arrSplit[3]; // number
        op.total = +arrSplit[4]; // subTotal/Total

        if (op.previousOperator == "clear") {
            tempHTML = clearValueEntry() + tempHTML;
        }
        else if (op.previousOperator == "total") {
            tempHTML = totalEntry() + tempHTML;
        }
        else {
            tempHTML = lineEntry() + tempHTML;

            if (i == lclLength - 1) { //LAST ENTRY
                op.newValFlg = false; // set to false, to not clear the value in textbox when digit is inputted
                op.term = op.total; // current value of textbox must be the last entry
                newNumber.value = op.total.toString();
                op.previousOperator = null;//set to NULL, client has to input new operation
            }
        }
    }

    entries.innerHTML = tempHTML;
    tape.scrollTop = tape.scrollHeight;
}

function getLocalStorageForDownload() {

    if (!op.storageId)
        return "";

    let sID = op.storageId,
        sortedLocalStorage = sortLocalStorage(sID),
        lclLength = sortedLocalStorage.length;

    if (lclLength < 1)
        return "";

    let textToDownload = "", newLineTx = " \r\n ";
    for (let i = lclLength - 1; i >= 0; i--) {

        let arrSplit = sortedLocalStorage[i].toString().split("|");

        let _operator = arrSplit[2],
            _number = arrSplit[3],
            _total = arrSplit[4]; // subTotal/Total

        if (_operator == "clear") {
            textToDownload = previousOperator + newLineTx + textToDownload;
        }
        else if (_operator == "total") {
            let exprsn = " Grand Total = " + _total; // = 5 (sample)
            textToDownload = exprsn + newLineTx + textToDownload;
        }
        else if (operators[_operator]) {
            let exprsn = operators[_operator] + " " + _number + " = " + _total; // + 10 = 5 (sample)
            textToDownload = exprsn + newLineTx + textToDownload;
        }
        else {
            let exprsn = " = " + _total; // = 100
            textToDownload = exprsn + newLineTx + textToDownload;
        }
    }

    txtDownload.value = textToDownload;
}

function downloadAsTextFile() {
    let fileName = getLocalStorageForDownload();

    if (fileName == "")
        return;

    let textFileAsBlob = new Blob([txtDownload.value], { type: 'text/plain' }),
        downloadLink = document.createElement("a");

    downloadLink.download = "";
    downloadLink.innerHTML = "Download File";

    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

init();

/*
 BUGS
 -percent not working
 -negative not working
 -double digit when keyPress
 */
