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
            const formattedContent = formatDitaContent(body);
            contentDiv.innerHTML = `<h2>${title}</h2>${formattedContent}`;
        } else {
            contentDiv.innerHTML = content;
        }
    }

    function formatDitaContent(body) {
        let formattedContent = '';
        if (body) {
            const children = body.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                switch (child.tagName.toLowerCase()) {
                    case 'p':
                        formattedContent += `<p>${child.textContent}</p>`;
                        break;
                    case 'section':
                        formattedContent += `<section>${formatDitaContent(child)}</section>`;
                        break;
                    case 'ul':
                        formattedContent += `<ul>${formatDitaContent(child)}</ul>`;
                        break;
                    case 'li':
                        formattedContent += `<li>${child.textContent}</li>`;
                        break;
                    case 'b':
                        formattedContent += `<b>${child.textContent}</b>`;
                        break;
                    case 'i':
                        formattedContent += `<i>${child.textContent}</i>`;
                        break;
                    // Add more cases as needed for other DITA elements
                    default:
                        formattedContent += child.outerHTML;
                        break;
                }
            }
        }
        return formattedContent;
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