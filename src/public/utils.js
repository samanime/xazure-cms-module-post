/* global modules */
const root = modules.admin.path;
const { adminPath } = modules.posts;

export const adminPostRoot = adminPath.replace(new RegExp(`^${root}`), '');

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = str => `00${str}`.substr(-2);

export const formatTime = timeStr => {
  const d = new Date(timeStr);
  return [
    `${days[d.getDay()]},`,
    [d.getMonth() + 1, d.getDate(), d.getFullYear()].map(pad).join('/'),
    `${[d.getHours() % 12 || 12, d.getMinutes()].map(pad).join(':')}${(d.getHours() >= 12 ? 'PM' : 'AM')}`
  ].join(' ');
};

export const toVueDateTimeFormat = timeStr => (new Date(timeStr)).toISOString().slice(0, -1);

export const buildLink = url => `${adminPostRoot}${url}`;