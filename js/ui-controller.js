'use strict';
/* global jQuery, $ */

import {
  DEFAULT_LANGUAGE,
} from './settings.js';

import {
  timeline,
} from './main.js';

let currentLanguage;
export let uiMultiLanguages = [
  { '#customer-info .popup__info_title': 'ui_order_customer_info' },
  { '#customer_name': 'ui_order_customer_info_name' },
  { '#customer_email': 'ui_order_customer_info_email' },
  { '#customer_zipcode': 'ui_order_customer_info_zipcode' },
  { '#design-links .popup__info_title': 'ui_order_design' },
  { '.ui_design_link': 'ui_design_link' },
  { '#invoices .popup__info_title': 'ui_order_invoices' },
  { '#order_first_invoice': 'order_first_invoice' },
  { '#order_second_invoice': 'order_second_invoice' },
  { '#timeline .popup__info_title': 'ui_order_timeline' },
  { '#manufacture_date_subtitle': 'manufacture_date_subtitle_expected' },
  { '#manufacture_date_text': 'manufacture_date_text_expected' },
  { '#ship_date_subtitle': 'ship_date_subtitle_expected' },
  { '#ship_date_text': 'ship_date_text_expected' },
  { '#delivery_date_subtitle': 'delivery_date_subtitle_expected' },
  { '#delivery_date_text': 'delivery_date_text_expected' },
];


export function createUI(data) {
  jQuery(document).ready(function ($) {
    $('.custom-select').select2({
      minimumResultsForSearch: Infinity, // Removes the search line if not needed
    });

    $('.language-picker select').val(DEFAULT_LANGUAGE);
    currentLanguage = $('.language-picker select').val() || DEFAULT_LANGUAGE;

    $('.language-picker select').on('change', function () {
      currentLanguage = $(this).val();
      updateUIlanguages(data);

      if (timeline) {
        const manufactureDate = humanizeDateStrings(timeline.manufacture.date, currentLanguage);
        const shipDate = humanizeDateStrings(timeline.ship.date, currentLanguage);
        const deliveryDate = humanizeDateStrings(timeline.delivery.date, currentLanguage);

        $('#manufacture_date_title').text(manufactureDate);
        $('#ship_date_title').text(shipDate);
        $('#delivery_date_title').text(deliveryDate);
      }
    });

    updateUIlanguages(data);
  });
}

//! **********************************************************

export function updateUIlanguages(dataArr, uiDataArr = uiMultiLanguages, langKey = currentLanguage) {
  for (let i = 0; i < uiDataArr.length; i++) {
    for (let key in uiDataArr[i]) {
      let contentText = getData(dataArr, uiDataArr[i][key], langKey);

      if (!contentText) continue;

      if (contentText !== '' && contentText?.toLowerCase() !== 'null') {
        if (contentText[0] === '"' && contentText[contentText.length - 1] === '"') {
          contentText = contentText.slice(1, -1);
        }
      } else {
        contentText = '';
      }

      $(key).html(contentText);
    }
  }
}

export function updateElementText(selector, newValue, array = uiMultiLanguages) {
  const item = array.find(obj => Object.keys(obj)[0] === selector);
  if (item) {
    item[selector] = newValue;
  }
}

export async function loadAndParseCSV(link, fileType, output, retryCount = 999, retryDelay = 1000) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(link);

      if (response.ok) {
        const type = response.headers.get('Content-Type');
        if (type && type.includes(fileType)) {
          const text = await response.text();
          parseCSV(text, output);
          return;
        } else {
          throw new Error(`Unexpected content type: ${type}`);
        }
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} to load ${link} failed:`, error);

      if (attempt < retryCount - 1) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(`Failed to load ${link} after ${retryCount} attempts`);
      }
    }
  }
}

function parseCSV(text, output) {
  const lines = text.split('\n');

  lines.forEach((line) => {
    line = line.trim();

    if (line.length === 0) return;

    const skipIndexes = {};
    const columns = line.split(',');

    output.push(
      columns.reduce((result, item, index) => {
        if (skipIndexes[index]) return result;

        if (item?.startsWith('"') && !item?.endsWith('"')) {
          while (!columns[index + 1].endsWith('"')) {
            index++;
            item += `,${columns[index]}`;
            skipIndexes[index] = true;
          }

          index++;
          skipIndexes[index] = true;
          item += `,${columns[index]}`;
        }

        result.push(item);
        return result;
      }, []),
    );
  });
}

export function getData(data, text, desiredId, titleId = 'id') {
  let titleIdInd = data[0]?.findIndex(
    (title) => title?.toUpperCase() === titleId?.toUpperCase(),
  );

  if (titleIdInd === -1) {
    titleIdInd = 0;
  }

  let index = data[0]?.findIndex(
    (title) => title?.toUpperCase() === desiredId?.toUpperCase(),
  );

  if (index === -1) {
    index = data[0].findIndex(
      (title) => title?.toUpperCase() === DEFAULT_LANGUAGE.toUpperCase(),
    );
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][titleIdInd].toUpperCase() === text.toUpperCase()) {
      let res = data[i][index];

      if (res[0] === '"' && res[res.length - 1] === '"') {
        res = res.slice(1, -1);
      }

      return res;
    }
  }

  return null;
}

export function parseNumber(str) {
  if (str === null || str === undefined) {
    return 0;
  }
  str = str.replace(/\s/g, '');
  str = str.replace(/,/g, '.');
  str = str.replace(/"/g, '');
  str = str.replace(/ /g, '');
  const number = parseFloat(str);
  if (isNaN(number)) return 0;

  return number;
}

export function humanizeDateStrings(dateStr, lang = 'EN') {
  const monthNames = {
    EN: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    FR: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    ES: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
  };

  let [year, month, day] = dateStr.split('-').map(Number);
  month = monthNames[lang][month];

  let resultString;

  if (lang === 'EN') {
    resultString = `${month} ${day}, ${year}`;
  } else if (lang === 'FR' || lang === 'ES') {
    resultString = `${day} ${month} ${year}`;
  }

  return resultString;
}
