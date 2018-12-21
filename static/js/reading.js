
// Default text when no text is saved
textTitle = "Migliori le tue abilità linguistiche!"
text = "Clicchi sulle parole per vedere la traduzione."

// var textTitle = "La mia casa a Roma"

// var text = `
// La mia casa a Roma
// Mi chiamo Francesca e abito nel centro di Roma. La mia casa è un po’ piccola ma molto confortevole. Qui vivo con mio marito e i miei due figli. La porta della casa è di legno, mentre le pareti sono tutte colorate. La mia stanza preferita è la cucina.
// Qui preparo tante cose buone per i miei bambini. Nella cucina ci sono un tavolo rotondo e quattro sedie. Nel soggiorno ci sono un divano, un mobile per la televisione e un tappeto. La sera mi rilasso sul divano con la mia famiglia.
// La camera matrimoniale ha le pareti beige e un grande comò. Sul comò ci sono uno specchio, tre cornici con le foto e il mio profumo. La camera dei bambini ha le pareti celesti. In questa stanza ci sono una scrivania, due sedie, due letti e un grande armadio con quattro ante.
// Il bagno è piccolo ma luminoso.`

var sourceLanguage = "it"
var targetLanguage = "en"

$(document).ready(function() {
    initiateLanguageSettings();
    initiateText();
    setupText()
});

function setupText() 
{
    var title = $("#title")
    title.text(textTitle)

    // Add break to every new line
    processedText = text.replace(/(?:\r\n|\r|\n)/g, "\n ")

    var words = processedText.split(" ")

    var container = $("#container")
    container.text("")

    var id = 0;
    words.forEach(word => {
        id++
        
        // If last char is new line add <br/> to maintain line break
        var lastChar = ' '
        if(word[word.length -1] == '\n')
            lastChar = '<br/>'

        var styled = getStyledWord(id, word)

        container.append(styled)
        container.append(lastChar)
    });
}

function getStyledWord(id, word)
{
    var elementId = 'word_' + id
    var styled = `<span class="to-be-translated" 
                        id="` + elementId + `" 
                        onclick="phraseClicked('` + elementId + `');">
                    <div class="translation small"></img></div>
                    <div class="original">` + word + `</div>
                </span>`
    
    return styled
}

async function phraseClicked(elementId)
{
    var phraseElement = $("#" + elementId)

    if(phraseElement.hasClass("to-be-translated")) // Join and translate phrase
    {
        phraseElement = getJointPhrase(elementId)

        // Add preloader. It will be replaced by translated phrase
        phraseElement.find(".translation").html('<img src="static/preloader.gif">')
        

        var translation = await translatePhrase(phraseElement.find(".original").text())

        phraseElement.find(".translation").text(translation)
        phraseElement.removeClass("to-be-translated")
        phraseElement.addClass("translated")
    }
    else // Remove translation
    {
        var words = phraseElement.find(".original").text().split(" ")
        var id = parseInt(elementId.split("_")[1]) + words.length - 1
        
        words.reverse().forEach(word => {
            var styled = getStyledWord(id, word)
            $(styled).insertAfter(phraseElement)
            phraseElement.after(" ")
            
            id--
        });

        phraseElement.remove();
    }
}

async function translatePhrase(phrase)
{
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sourceLanguage + "&tl=" + targetLanguage + "&dt=t&q=" + encodeURI(phrase)
    var response = await fetch(url)
    var result = await response.json()
    var translations = result[0]
    var translation = ""
    translations.forEach(element => {
        translation += element[0]
    });
    return translation
}

// Join selected phrase with already translated neighboring phrases
// Return newly created phrase element
function getJointPhrase(elementId) {
    var phraseElement = $("#" + elementId)
    var prev = phraseElement.prev()
    var next = phraseElement.next()

    if(prev.hasClass("translated"))
    {
        prev.find(".original").append(" ")
        prev.find(".original").append(phraseElement.find(".original").text())
        phraseElement.remove()
        phraseElement = prev
    }

    if(next.hasClass("translated"))
    {
        phraseElement.find(".original").append(" ")
        phraseElement.find(".original").append(next.find(".original").text())
        next.remove()
    }

    return phraseElement
}

function startNewTextClicked()
{
    var newTextModal = $("#new-text-modal")
    var newTextTitle = $("#new-text-title")
    var newText = $("#new-text")

    if(newTextTitle.val() != "" && newText.val() != "")
    {
        newTextModal.modal('hide')

        textTitle = newTextTitle.val()
        text = newText.val()

        // Save the text locally
        localStorage.setItem("textTitle", textTitle)
        localStorage.setItem("text", text)

        setupText()

        newTextTitle.val("")
        newText.val("")
    }
}

function newTextChanged()
{
    var newTextTitle = $("#new-text-title")
    var newText = $("#new-text")

    var titleWords = newText.val().replace(/(?:\r\n|\r|\n)/g, " ").split(" ").slice(0, 5)
    var titleWords = titleWords.filter(element => {
        return element != "";
    });
    
    newTextTitle.val(titleWords.join(" "))
}

function initiateText()
{
    var savedTextTitle = localStorage.getItem('textTitle')
    var savedText = localStorage.getItem('text')

    if(savedTextTitle != null && savedText != null)
    {
        textTitle = savedTextTitle
        text = savedText
    }
}

function initiateLanguageSettings()
{
    // If preferred languages are saved - use them
    var source = localStorage.getItem('sourceLanguage')
    var target = localStorage.getItem('targetLanguage')

    if(source != null && target != null)
    {
        $("#source-ln-select").val(source.toUpperCase())
        $("#target-ln-select").val(target.toUpperCase())
    }

    readSelectedLanguages()
}

function readSelectedLanguages()
{
    var sourceLnSelect = $("#source-ln-select")
    var targetLnSelect = $("#target-ln-select")

    sourceLanguage = sourceLnSelect.val().toLowerCase()
    targetLanguage = targetLnSelect.val().toLowerCase()
}

function languageChanged()
{
    readSelectedLanguages()

    // Save preferred languages locally
    localStorage.setItem("sourceLanguage", sourceLanguage)
    localStorage.setItem("targetLanguage", targetLanguage)

    // Restart translating
    setupText()
}
