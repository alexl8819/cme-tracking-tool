import { Buffer } from '@craftzdog/react-native-buffer';

const onlineKeywords: string[] = ['Online', 'Zoom', 'Live', 'Stream'];

// first-chance: attempts to parse specific words using regex
export default function parseLines (output: Buffer | string) {
  const txtDump = (Buffer.isBuffer(output) ? output.toString('utf8') : output).trim();
  let location = 'na';
  let hours = 'na';
  let dates = 'na';
  for (const line of txtDump.split('\n')) {
    if (/s?Location/i.test(line)) {
      const oLine = line.split(':')[1].trim();
      const re = new RegExp(`(?:${onlineKeywords.join('|')})`, 'gsi');
      location = re.test(oLine) ? 'online' : oLine;
    } /*else if () {
    }*/ else if (/\s?Hou(r)?s\:/i.test(line)) {
      hours = line.split(':').find((token) => parseFloat(token.trim()).toFixed(1));
    } else if (/\S?(\d+)\shour/i.test(line)) {
      const matches = line.trim().match(/\S?(\d+)\shour/i);
      if (matches) {
        hours = parseFloat(matches[1]).toFixed(1);
      }
    } else if (/\s?Date/.test(line)) {
      dates = line.split(':')[1].trim();
    } else if (/on\s?(\S+)?\s(\d+\/\d+\/\d+)+/i.test(line)) {
      const matches = line.trim().match(/on\s?(\S+)?\s(\d+\/\d+\/\d+)+/i);
      if (matches) {
        dates = matches.length > 1 ? matches[2] : matches[1];
      }
    }
  }
  return {
    l: location,
    ch: hours,
    ds: dates
  };
}
