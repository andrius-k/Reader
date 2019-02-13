
var mainText = null

$(document).ready(function() {
    showStoredCurrentText()
})

function showStoredCurrentText()
{
    mainText = getCurrentStoredText()
    setLanguageSelects()
    setupText()
}

// ============= Language related stuff =============

function setLanguageSelects()
{
    $("#source-ln-select").val(mainText.sourceLanguage.toUpperCase())
    $("#target-ln-select").val(mainText.targetLanguage.toUpperCase())
}

function languageChanged()
{
    changeLnOfCurrentStoredText()

    mainText = getCurrentStoredText()
    
    // Restart translating
    setupText()
}

// ============= Text processing and presentation =============

function setupText() 
{
    var title = $("#title")
    title.text(mainText.title)

    // Add break to every new line
    processedText = mainText.text.replace(/(?:\r\n|\r|\n)/g, "\n ")

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
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + mainText.sourceLanguage + "&tl=" + mainText.targetLanguage + "&dt=t&q=" + encodeURI(phrase)
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

// ============= Popup event handlers =============

function startNewTextClicked()
{
    var newTextModal = $("#new-text-modal")
    var newTextTitle = $("#new-text-title")
    var newText = $("#new-text")

    if(newTextTitle.val() != "" && newText.val() != "")
    {
        newTextModal.modal('hide')

        mainText = addStoredText(newTextTitle.val(), newText.val())

        // Populate UI with newly entered text
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
    var titleWords = titleWords.filter(element => element != "");
    
    newTextTitle.val(titleWords.join(" "))
}

$('#saved-texts-modal').on('show.bs.modal', drawStoredTextsModal)

function drawStoredTextsModal()
{
    var modalElement = $("#saved-texts-modal-body")
    var texts = getStoredTexts()

    // Reset content
    modalElement.html("")

    texts.forEach(e => {
        var shortText = e.text.split(" ").slice(0, 30).join(" ");
        if(shortText.length < e.text.length)
            shortText += "..."
        
        modalElement.append(getStyledTextListItem(e.title, shortText, e.id, e.sourceLanguage, e.targetLanguage))
    })

    if(texts.length == 0)
    {
        modalElement.append(`<p class="font-italic text-secondary text-center">No stored texts right now. You can add them by clicking 'Add' in the header!</p>`)
    }
}

function getStyledTextListItem(title, text, id, sl, tl)
{
    return `
        <div class="media text-muted pt-3">
            <div class="container media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                <div class="row pb-2">
                    <div class="col pl-0">
                        <button type="button" class="btn btn-link btn-sm btn-saved-title p-0" onclick="startReadingSavedText(` + id + `)">` + title + `</button>
                        <span class="font-italic">(` + sl + ` → ` + tl + `)</span>
                    </div>
                    <div class="col-auto mt-auto mb-auto pr-0">
                        <button type="button" class="btn btn-link btn-sm text-danger p-0" onclick="deleteSavedText(` + id + `)">Delete</button>
                    </div>
                </div>
                <div class="row">
                    <span class="d-block">` + text + `</span>
                </div>
            </div>
        </div>`
}

function deleteSavedText(id)
{
    var needToRedrawMain = mainText.id == id

    deleteStoredText(id)
    drawStoredTextsModal()

    if(needToRedrawMain)
        showStoredCurrentText()
}

function startReadingSavedText(id)
{
    makeStoredTextCurrent(id)
    showStoredCurrentText()
    $('#saved-texts-modal').modal('hide')
}

// ============= Local storage access API =============

function getStoredTexts()
{
    var texts = JSON.parse(getStoredItem("texts"))
    return texts != null ? texts : []
}

function setStoredTexts(texts)
{
    setStoredItem("texts", JSON.stringify(texts))
}

function getCurrentStoredText()
{
    var texts = getStoredTexts()

    // If no current text is stored the default will be returned
    var title = "Migliori le tue abilità linguistiche!"
    var text = "Clicchi sulle parole per vedere la traduzione."
    var result = {
        isCurrent: true,
        sourceLanguage: "it",
        targetLanguage: "en",
        title: title,
        text: text,
        id: (title + title).hashCode()
    }

    texts.forEach(element => {
        if(element.isCurrent)
            result = element
    })

    return result
}

function addStoredText(title, text)
{
    var texts = getStoredTexts()

    texts.forEach(element => {
        element.isCurrent = false
    })

    var sourceLnSelect = $("#source-ln-select")
    var targetLnSelect = $("#target-ln-select")
    
    var newText = {
        isCurrent: true,
        sourceLanguage: sourceLnSelect.val().toLowerCase(),
        targetLanguage: targetLnSelect.val().toLowerCase(),
        title: title,
        text: text,
        id: (title + title).hashCode()
    }

    texts.push(newText)
    setStoredTexts(texts)

    return newText
}

function changeLnOfCurrentStoredText()
{
    var texts = getStoredTexts()

    texts.forEach(element => {
        if(element.isCurrent)
        {
            var sourceLnSelect = $("#source-ln-select")
            var targetLnSelect = $("#target-ln-select")

            element.sourceLanguage = sourceLnSelect.val().toLowerCase()
            element.targetLanguage = targetLnSelect.val().toLowerCase()

            setStoredTexts(texts)
        }
    })
}

function makeStoredTextCurrent(id)
{
    var texts = getStoredTexts()

    texts.forEach(element => {
        if(element.id == id)
        {
            element.isCurrent = true;
        }
        else
        {
            element.isCurrent = false;
        }
    })

    setStoredTexts(texts)
}

function deleteStoredText(id)
{
    var texts = getStoredTexts()
    var removed = texts.filter(e => e.id != id)

    // If current text was removed, make random text current
    if(removed.filter(e => e.isCurrent == true).length == 0)
        if(removed.length > 0)
            removed[0].isCurrent = true

    setStoredTexts(removed)
}

// ============= Helpers =============

String.prototype.hashCode = function() 
{
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) 
    {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};
