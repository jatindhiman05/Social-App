// utils/dateUtils.js

export function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }

    return "just now";
}

export function formatDate(createdAt) {
    const date = new Date(createdAt);
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();

    return `${day}${suffix} ${month} ${year}`;
}


function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return "th";

    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

export function smartFormatDate(dateString, thresholdDays = 7) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    return diffDays < thresholdDays ? formatRelativeTime(dateString) : formatDate(dateString);
}