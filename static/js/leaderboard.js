const leaderboardState = {
    rows: [],
    sortKey: 'overall_score_mean',
    direction: 'desc'
};

const lowerIsBetter = new Set(['ade_mean', 'fde_mean', 'miss_rate_mean']);

function formatMetric(value, digits = 3) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : '—';
}

function renderLeaderboard() {
    const body = document.getElementById('leaderboard-body');
    const { sortKey, direction } = leaderboardState;
    const referenceRow = leaderboardState.rows.find(row => row.model === 'gt_videos');
    const modelRows = leaderboardState.rows.filter(row => row.model !== 'gt_videos');
    const rankByModel = new Map(
        [...modelRows]
            .sort((a, b) => Number(b.overall_score_mean) - Number(a.overall_score_mean))
            .map((row, index) => [row.model, index + 1])
    );
    modelRows.sort((a, b) => {
        const left = sortKey === 'model' ? a[sortKey].toLowerCase() : Number(a[sortKey]);
        const right = sortKey === 'model' ? b[sortKey].toLowerCase() : Number(b[sortKey]);
        if (left === right) return 0;
        const comparison = left < right ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
    });
    const rows = referenceRow ? [referenceRow, ...modelRows] : modelRows;

    body.innerHTML = rows.map(row => {
        const reference = row.model === 'gt_videos';
        const rank = rankByModel.get(row.model);
        const modelLabel = reference
            ? `${row.model}<span class="model-reference-label">ground-truth</span>`
            : row.model;
        return `
            <tr class="${reference ? 'is-reference' : ''}">
                <td ${reference ? 'class="reference-rank" aria-label="Unranked reference"' : ''}>${reference ? '' : `<span class="rank-medal rank-${rank}">${rank}</span>`}</td>
                <td><strong>${modelLabel}</strong></td>
                <td><strong>${formatMetric(row.overall_score_mean)}</strong></td>
                <td>${formatMetric(row.ade_mean)}</td>
                <td>${formatMetric(row.fde_mean)}</td>
                <td>${formatMetric(row.miss_rate_mean, 1)}%</td>
                <td>${formatMetric(row.se_mean)}</td>
                <td>${formatMetric(row.ac_mean)}</td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.leaderboard-table th button').forEach(button => {
        button.classList.toggle('active-sort', button.dataset.sort === sortKey);
    });
}

document.querySelectorAll('.leaderboard-table th button').forEach(button => {
    button.addEventListener('click', () => {
        const key = button.dataset.sort;
        if (leaderboardState.sortKey === key) {
            leaderboardState.direction = leaderboardState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            leaderboardState.sortKey = key;
            leaderboardState.direction = lowerIsBetter.has(key) || key === 'model' ? 'asc' : 'desc';
        }
        renderLeaderboard();
    });
});

fetch('resources/results/vggt_omega_leaderboard.json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        leaderboardState.rows = data.rows;
        const rankedModels = data.rows.filter(row => row.model !== 'gt_videos').length;
        document.getElementById('leaderboard-meta').textContent =
            `${rankedModels} ranked models + ground-truth · ${data.num_segments} benchmark segments · ${data.generated_at}`;
        renderLeaderboard();
    })
    .catch(error => {
        console.error('Unable to load leaderboard:', error);
        document.getElementById('leaderboard-body').innerHTML =
            '<tr><td colspan="8" class="leaderboard-status">Evaluation is running. Results will appear here when complete.</td></tr>';
        document.getElementById('leaderboard-meta').textContent = 'Evaluation in progress';
    });
