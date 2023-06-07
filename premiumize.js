// Define the global API key variable
let apiKey;


// Get the necessary elements
const apiKeyPopup = document.querySelector('.apikey-popup');
const apiKeyClose = document.querySelector('.apikey-close');
const apiKeySubmit = document.querySelector('#apikey-submit');

// Function to show the API key popup
function showApiKeyPopup() {
  apiKeyPopup.style.display = 'block';
  const apiKeyInput = document.getElementById('apikey-input');

  if (apiKey) {
      apiKeyInput.value = apiKey;
  }

}

// Function to close the API key popup
function closeApiKeyPopup() {
  apiKeyPopup.style.display = 'none';
}

// Event listener for the close button
apiKeyClose.addEventListener('click', closeApiKeyPopup);

// Event listener for the submit button
apiKeySubmit.addEventListener('click', () => {
  const apiKeyInput = document.querySelector('#apikey-input');
        apiKey = apiKeyInput.value.trim();
        
        if(apiKey == 'dev'){ apiKey = '************************';}

  // Check if an API key is provided
  if (apiKey) {
    // Store the API key in local storage or any other suitable method
    localStorage.setItem('apiKey', apiKey);
    console.log(localStorage.getItem('apiKey'));
    console.log(apiKey);
    closeApiKeyPopup();
  }
});

// Event listener to close the popup if clicked outside of it
window.addEventListener('click', (event) => {
  if (event.target === apiKeyPopup) {
    closeApiKeyPopup();
  }
});

// Show the API key popup initially if the apiKey is not already stored
if (!localStorage.getItem('apiKey')) {
  showApiKeyPopup();
}


// Open the popup window
function openStreamBlock(streamLink) {
  // Set the video source and VLC link
  const videoPlayer = document.getElementById('videoPlayer');
  videoPlayer.src = streamLink;
  const vlcLinkElement = document.getElementById('vlcLink');
  vlcLinkElement.href = 'vlc:\\' + streamLink;

  // Show the popup window
  const streamBlock = document.getElementById('streamBlock');
  streamBlock.style.display = 'block';

  // Close the popup window when clicking outside
  window.onclick = function(event) {
    if (event.target === streamBlock) {
      closeStreamBlock();
    }
  };
}

// Close the popup window
function closeStreamBlock() {
  const streamBlock = document.getElementById('streamBlock');
  
  // Stop the video playback
  videoPlayer.currentTime = 0;
  videoPlayer.pause();
  
  streamBlock.style.display = 'none';
}

function downloadAndStreamLargestFile(magnetLink) {
    
    if(!apiKey){ return; }

  // Step 1: Create transfer
  const createTransferUrl = `https://www.premiumize.me/api/transfer/create?apikey=${apiKey}&src=${encodeURIComponent(magnetLink)}`;
  fetch(createTransferUrl)
    .then(response => response.json())
    .then(data => {
      // Step 2: Retrieve transfer ID
      const transferId = data.id;

      // Step 3: Check transfer status and progress
      const checkStatusAndProgress = setInterval(() => {
        const transferStatusUrl = `https://www.premiumize.me/api/transfer/list?apikey=${apiKey}`;
        fetch(transferStatusUrl)
          .then(response => response.json())
          .then(data => {
            const transfer = data.transfers.find(t => t.id === transferId);
            if (transfer) {
              const { status, progress, message } = transfer;
              // Update the UI with the status and progress information
              updateStatusAndProgress(status, progress, message);

              if (status === 'finished') {
                // Step 4: Get file list
                const fileListUrl = `https://www.premiumize.me/api/folder/list?apikey=${apiKey}&id=${transfer.folder_id}`;
                fetch(fileListUrl)
                  .then(response => response.json())
                  .then(data => {
                    // Step 5: Find the largest file
                    const files = data.content;
                    if (files.length > 0) {
                      const largestFile = files.reduce((prev, current) => (prev.size > current.size) ? prev : current);

                      // Step 6: Get stream link for the largest file
                      const streamUrl = `https://www.premiumize.me/api/item/details?apikey=${apiKey}&id=${largestFile.id}`;
                      fetch(streamUrl)
                        .then(response => response.json())
                        .then(data => {
                          // Step 7: Embed video player and stream the file
                          const streamLink = data.stream_link;

                          // Optionally, open the stream block/pop-up here
                          openStreamBlock(streamLink);
                        })
                        .catch(error => {
                          console.error('Error getting stream link:', error);
                        });
                    } else {
                      console.error('No files found in the transfer:', transferId);
                    }
                  })
                  .catch(error => {
                    console.error('Error getting file list:', error);
                  });

                // Stop checking status and progress
                clearInterval(checkStatusAndProgress);
              }
            } else {
              console.error('Transfer not found:', transferId);
            }
          })
          .catch(error => {
            console.error('Error checking transfer status:', error);
          });
      }, 5000); // Check every 5 seconds
    })
    .catch(error => {
      console.error('Error creating transfer:', error);
    });
}

function updateStatusAndProgress(status, progress, message) {
  // Update the UI elements with the transfer status and progress
  const statusElement = document.getElementById('status');
  const progressElement = document.getElementById('progress');
  const messageElement = document.getElementById('message');

  statusElement.textContent = `Status: ${status}`;
  progressElement.textContent = `Progress: ${progress}%`;
  messageElement.textContent = message;
}

function directLink(magnetLink) {
        
        if(!apiKey){ return; }

        const url = `https://www.premiumize.me/api/transfer/directdl?apikey=${apiKey}`;
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: `src=${encodeURIComponent(magnetLink)}`
        };

        fetch(url, options)
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success' && data.content && data.content.length > 0) {
              const transfers = data.content;
              const largestFile = transfers.reduce((prev, current) => (prev.size > current.size) ? prev : current);


              streamLink = largestFile.stream_link;

              openStreamBlock(streamLink);
            } else {
              console.log('Could not direct link, adding to downloads.');
                 downloadAndStreamLargestFile(magnetLink);
                 document.getElementById('transferStatus').innerText = 'Error creating transfer. Please try again.';
              document.getElementById('downloadLink').innerHTML = '';
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
      
function checkCache(magnetLink) {
    
  if(!apiKey){ return; } 
 
  console.log('here is the api key: '+ apiKey);
  
  const apiUrl = 'https://www.premiumize.me/api/cache/check';

  // Encode the magnet link parameter
  const encodedMagnetLink = encodeURIComponent(magnetLink);

  // Construct the complete URL with encoded parameters
  const url = `${apiUrl}?items%5B%5D=${encodedMagnetLink}&apikey=${apiKey}`;

  const options = {
    headers: {
      'Accept': 'application/json',
    },
  };

  return fetch(url, options)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Cache check failed');
      }
    })
    .then(data => {
      if (data && data.status === 'success' && data.response[0]) {
        const isCached = data.response[0];
        if (isCached) {
          const filename = data.filename[0];
          const filesize = data.filesize[0];

          console.log('File is in the cache');
          console.log('Filename:', filename);
          console.log('Filesize:', filesize);

          return true;
        } else {
          console.log('File is not in the cache');
          return null;
        }
      } else {
        console.log('Cache check failed');
        return null;
      }
    })
    .catch(error => {
      console.error('Cache check failed:', error);
      return null;
    });
}

