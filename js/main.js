'use strict';
/* global $ */

import {
  DATAFILE_CSV_LINK_UI,
  // testProps, //! DEBUG
} from './settings.js';

import {
  createUI,
  loadAndParseCSV,
  updateElementText,
  humanizeDateStrings,
} from './ui-controller.js';

let dataMain = [];
export let timeline;

async function fetchDealData(dealId) {
  try {
    const url = `https://zome-orders-backend.vercel.app/api/getDeal?dealId=${dealId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('🚀 Error:', error.message);
    return null;
  }
}

function getDisplayDate(expected, actual) {
  if (actual) return { date: actual, label: 'actual' };
  return { date: expected, label: 'expected' };
}

async function initPage() {
  const dealId = new URLSearchParams(window.location.search).get('orderid');
  if (!dealId) {
    document.querySelector('main').innerHTML = '<p>Error: Indicate Orderid in the URL</p>';
    $('#js-loader').addClass('invisible');
    return;
  }

  const dealData = await fetchDealData(dealId);
  if (!dealData || !dealData.properties) {
    document.querySelector('main').innerHTML = '<p>Data loading error</p>';
    $('#js-loader').addClass('invisible');
    return;
  }

  const props = dealData.properties;

  // console.log("🚀 ~ initPage ~ props:", props); //! DEBUG
  // const props = testProps; //! DEBUG

  // customer-info
  document.getElementById('customer-info').innerHTML = `
    <div class="popup__info_title"></div>
    <div class="popup__info_item">
      <div class="customer_info_title" id="customer_name"></div>
      <div class="customer_info_content">${props.dealname || ''}</div>
    </div>
  `;

  // design-links
  const designsRaw = props.final_designs || '';
  const designs = designsRaw
    .split('\n')
    .filter(line => line.trim())
    .map((line) => {
      const match = line.match(/^(\d+)x\s*(https?:\/\/[^\s]+)/);
      if (match) {
        const [, quantity, url] = match;
        return { quantity: parseInt(quantity), url };
      }
      
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      return urlMatch ? { quantity: 1, url: urlMatch[0] } : null;
    })
    .filter(item => item);

  document.getElementById('design-links').innerHTML = `
    <div class="popup__info_title">Final Designs</div>
    ${designs.length > 0 
      ? designs.map((design, index) => `
          <div>
            <a href="${design.url}&s=final" target="_blank"><span class="ui_design_link"></span> ${index + 1}</a>
            <span> / Quantity: ${design.quantity}</span>
          </div>
        `).join('<br>')
      : `<span class="ui_design_link"></span>`}
  `;

  (!props.final_designs || designs.length == 0) && updateElementText('.ui_design_link', 'ui_design_link_null');

  // invoice-links
  // document.getElementById('invoice-links').innerHTML = `
  //  <img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
  //   <a href="${props.first_invoice || '#'}" target="_blank" id="order_first_invoice">
  //   First Invoice</a><br>
  //   <img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
  //   <a href="${props.second_invoice || '#'}" target="_blank" id="order_second_invoice">Second Invoice</a>
  // `;

  document.getElementById('invoice-links').innerHTML = `
    ${props.first_invoice 
      ? `<img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
         <a href="${props.first_invoice || '#'}" target="_blank" id="order_first_invoice"></a><br><br>` 
      : `<span id="order_first_invoice"></span><br><br>`}
    ${props.second_invoice 
      ? `<img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
         <a href="${props.second_invoice || '#'}" target="_blank" id="order_second_invoice"></a>` 
      : `<span id="order_second_invoice"></span>`}
  `;


  (!props.first_invoice) && updateElementText('#order_first_invoice', 'order_first_invoice_null');
  (!props.second_invoice) && updateElementText('#order_second_invoice', 'order_second_invoice_null');

  // Timeline
  timeline = {
    manufacture: getDisplayDate(props.expected_manufactured_date, props.actual_manufactured_date),
    ship: getDisplayDate(props.expected_ship_date, props.actual_shipped_date),
    delivery: getDisplayDate(props.expected_delivery_date, props.actual_delivered_date),
  };

  const currentLanguage = $('.language-picker select').val() || 'EN';
  const manufactureDate = humanizeDateStrings(timeline.manufacture.date, currentLanguage);
  const shipDate = humanizeDateStrings(timeline.ship.date, currentLanguage);
  const deliveryDate = humanizeDateStrings(timeline.delivery.date, currentLanguage);

  $('#manufacture_date_title').text(manufactureDate);
  $('#ship_date_title').text(shipDate);
  $('#delivery_date_title').text(deliveryDate);

  updateElementText('#manufacture_date_subtitle', 'manufacture_date_subtitle_' + timeline.manufacture.label);
  updateElementText('#manufacture_date_text', 'manufacture_date_text_' + timeline.manufacture.label);
  updateElementText('#ship_date_subtitle', 'ship_date_subtitle_' + timeline.ship.label);
  updateElementText('#ship_date_text', 'ship_date_text_' + timeline.ship.label);
  updateElementText('#delivery_date_subtitle', 'delivery_date_subtitle_' + timeline.delivery.label);
  updateElementText('#delivery_date_text', 'delivery_date_text_' + timeline.delivery.label);

  $('#js-loader').addClass('invisible');
}

// **************************************************************

start();

async function prepareDataFiles() {
  try {
    await loadAndParseCSV(DATAFILE_CSV_LINK_UI, 'text', dataMain);
  } catch (error) {
    console.error("Error loading data files:", error);
  }
}

async function start() {
  await prepareDataFiles();
  createUI(dataMain);
  initPage();
}

// **************************************************************
