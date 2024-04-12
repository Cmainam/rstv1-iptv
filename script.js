document.addEventListener("DOMContentLoaded", function() {
    const videoPlayer = videojs('video-player', {
        fluid: true,
        controls: true,
        autoplay: true,
        preload: 'auto'
    });

    const playlistUrl = 'https://m3u.ch/pl/9ac3db698c37446a1fe2811fe93c8533_89831d2052d99038edd0275cddf93560.m3u';
    fetchAndParsePlaylist(playlistUrl);

    function fetchAndParsePlaylist(playlistUrl) {
        fetch(playlistUrl)
            .then(response => response.text())
            .then(data => {
                const lines = data.trim().split('\n');
                const channels = extractChannels(lines);
                populatePlaylistAndTabs(channels);
            })
            .catch(error => console.error('Error fetching playlist data:', error));
    }

    function extractChannels(lines) {
        const channels = [];
        let currentChannel = null;
        lines.forEach(line => {
            if (line.startsWith('#EXTINF:')) {
                const [, tvgNameMatch] = line.match(/tvg-name="(.*?)"/) || [];
                const [, logoUrl] = line.match(/tvg-logo="(.*?)"/) || [];
                const [, groupName] = line.match(/group-title="(.*?)"/) || [];
                const [, channelName] = line.match(/,(.*)/) || [];
                const name = tvgNameMatch || channelName;
                currentChannel = { name, logoUrl, groupName };
            } else if (line.trim() && currentChannel) {
                channels.push({ ...currentChannel, url: line.trim() });
                currentChannel = null;
            }
        });
        return channels;
    }

    function populatePlaylistAndTabs(channels) {
        const playlistContainer = document.getElementById('playlist');
        const groupTabsContainer = document.getElementById('group-tabs');
        const groupedChannels = groupChannels(channels);

        for (const groupName in groupedChannels) {
            const groupTab = document.createElement('div');
            groupTab.classList.add('group-tab');
            groupTab.textContent = groupName;
            groupTab.addEventListener('click', function() {
                document.querySelectorAll('.group-content').forEach(content => {
                    content.style.display = 'none';
                });
                const groupContent = document.getElementById(groupName.toLowerCase().replace(/\s+/g, '-'));
                groupContent.style.display = 'block';
            });
            groupTabsContainer.appendChild(groupTab);

            const groupContent = document.createElement('div');
            groupContent.classList.add('group-content');
            groupContent.id = groupName.toLowerCase().replace(/\s+/g, '-');

            groupedChannels[groupName].forEach(channel => {
                const playlistItem = createPlaylistItem(channel);
                groupContent.appendChild(playlistItem);
            });
            playlistContainer.appendChild(groupContent);

            if (groupName === Object.keys(groupedChannels)[0]) {
                groupTab.click();
            }
        }
    }

    function groupChannels(channels) {
        const groupedChannels = {};
        channels.forEach(channel => {
            const groupName = channel.groupName || 'Uncategorized';
            if (!groupedChannels[groupName]) {
                groupedChannels[groupName] = [];
            }
            groupedChannels[groupName].push(channel);
        });
        return groupedChannels;
    }

    function createPlaylistItem(channel) {
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('channel');
        playlistItem.textContent = channel.name;

        if (channel.logoUrl) {
            const logoImage = document.createElement('img');
            logoImage.src = channel.logoUrl;
            logoImage.alt = channel.name;
            logoImage.classList.add('logo');
            playlistItem.appendChild(logoImage);
        }

        playlistItem.addEventListener('click', function() {
            videoPlayer.src(channel.url);
        });
        return playlistItem;
    }

    // Search functionality
    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', function() {
        const searchValue = searchBar.value.toLowerCase();
        const channels = document.querySelectorAll('.channel');
        channels.forEach(channel => {
            const channelName = channel.textContent.toLowerCase();
            if (channelName.includes(searchValue)) {
                channel.style.display = 'block';
            } else {
                channel.style.display = 'none';
            }
        });
    });
});