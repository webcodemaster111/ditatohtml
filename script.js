document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const contentDiv = document.getElementById('content');
    const downloadBtn = document.getElementById('download-btn');
    let currentFileContent = '';
    let currentFileType = '';

    dropZone.addEventListener('dragover', function(event) {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(event) {
        event.preventDefault();
        dropZone.classList.remove('dragover');

        const file = event.dataTransfer.files[0];
        if (file && (file.name.endsWith('.dita') || file.name.endsWith('.html'))) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentFileContent = e.target.result;
                currentFileType = file.name.endsWith('.dita') ? 'dita' : 'html';
                displayFileContent(currentFileContent, currentFileType);
                downloadBtn.style.display = 'block';
            };
            reader.readAsText(file);
        } else {
            contentDiv.innerHTML = '<p>Please drop a valid DITA or HTML file.</p>';
        }
    });

    downloadBtn.addEventListener('click', function() {
        const convertedContent = convertFileContent(currentFileContent, currentFileType);
        const blob = new Blob([convertedContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = currentFileType === 'dita' ? 'converted.html' : 'converted.dita';
        link.click();
    });

    function displayFileContent(content, type) {
        if (type === 'dita') {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            const title = xmlDoc.getElementsByTagName('title')[0]?.textContent || 'No Title';
            const body = xmlDoc.getElementsByTagName('body')[0];
            contentDiv.innerHTML = `<h2>${title}</h2>${parseDITAContent(body)}`;
        } else {
            contentDiv.innerHTML = content;
        }
    }

    function parseDITAContent(node) {
        if (!node) return '';
        let htmlContent = '';
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                switch (child.tagName.toLowerCase()) {
                    case 'p':
                        htmlContent += `<p>${parseDITAContent(child)}</p>`;
                        break;
                    case 'ul':
                        htmlContent += `<ul>${parseDITAContent(child)}</ul>`;
                        break;
                    case 'li':
                        htmlContent += `<li>${parseDITAContent(child)}</li>`;
                        break;
                    case 'b':
                    case 'uicontrol':
                        htmlContent += `<b>${parseDITAContent(child)}</b>`;
                        break;
                    case 'title':
                        htmlContent += `<h2>${parseDITAContent(child)}</h2>`;
                        break;
                    default:
                        htmlContent += parseDITAContent(child);
                        break;
                }
            } else if (child.nodeType === Node.TEXT_NODE) {
                htmlContent += child.textContent;
            }
        });
        return htmlContent;
    }

    function convertFileContent(content, type) {
        if (type === 'dita') {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            const title = xmlDoc.getElementsByTagName('title')[0]?.textContent || 'No Title';
            const body = xmlDoc.getElementsByTagName('body')[0]?.innerHTML || 'No Content';
            return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
        } else {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/html');
            const title = xmlDoc.getElementsByTagName('title')[0]?.textContent || 'No Title';
            const body = xmlDoc.getElementsByTagName('body')[0]?.innerHTML || 'No Content';
            return `<?xml version="1.0" encoding="UTF-8"?><topic id="converted_topic"><title>${title}</title><body>${body}</body></topic>`;
        }
    }
});
