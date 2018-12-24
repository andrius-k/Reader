
var inMemoryStore = {}
var storageSupported = false

function getStoredItem(key)
{
    if(isStorageSupported())
    {
        return localStorage.getItem(key)
    }
    else if (inMemoryStore.hasOwnProperty(key))
    {
        return inMemoryStore[key]
    }

    return null
}

function setStoredItem(key, value)
{
    if(isStorageSupported())
    {
        localStorage.setItem(key, value)
    }
    else
    {
        inMemoryStore[key] = value
    }
}

function clearStore()
{
    if(isStorageSupported())
    {
        localStorage.clear()
    }
    else
    {
        inMemoryStore = {}
    }
}

function isStorageSupported() 
{
    // Use cached result if previously detected
    // that localStorage is supported
    if(storageSupported)
        return true
    
    try 
    {
        const testKey = "__some_random_key_you_are_not_going_to_use__";
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);

        storageSupported = true
        return true;
    } 
    catch (e) 
    {
        return false;
    }
}
