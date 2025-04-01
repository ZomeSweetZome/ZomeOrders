'use strict';
/* global $ */

import {
  DATAFILE_CSV_LINK_UI,
  // testProps, testСontacts, //! DEBUG
} from './settings.js';

import {
  createUI,
  loadAndParseCSV,
  updateElementText,
  humanizeDateStrings,
  subtractWeeks,
  updateUIlanguages,
} from './ui-controller.js';

let dataMain = [];
window.dataMain = dataMain;
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

  const props = dealData.properties || {};
  const contacts = dealData.associatedContacts[0].properties || [];

  console.log("🚀 ~ initPage ~ props:", props); //! DEBUG
  console.log("🚀 ~ initPage ~ contacts:", contacts); //! DEBUG

  // const props = testProps; //! DEBUG
  // const contacts = testСontacts; //! DEBUG

  const currentLanguage = $('.language-picker select').val() || 'EN';

  // customer-info
  document.getElementById('customer-info').innerHTML = `
    <div class="popup__info_title"></div>
    <div class="popup__info_item">
      <div class="customer_info_title" id="customer_name"></div>
      <div class="customer_info_content">${(contacts.firstname || '') + ' ' + (contacts.lastname || '')}</div>
      <br>
      <div class="customer_info_title" id="customer_email"></div>
      <div class="customer_info_content">${contacts.email || ''}</div>
      <br>
      <div class="customer_info_title" id="customer_phone"></div>
      <div class="customer_info_content">${contacts.phone || ''}</div>
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

  // Invoices
  document.getElementById('invoice-links').innerHTML = `
    <div class="section__invoices">
      <div class="invoice__container">
        ${props.first_invoice 
          ? `<div><img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <a href="${props.first_invoice || '#'}" target="_blank" id="order_first_invoice"></a></div>` 
          : `<span><span id="order_first_invoice"></span><span id="order_first_invoice2"></span></span>`}

        ${props.first_payment_link 
          ? `<div><img src="./src/ar-ui-icons/wallet.png" alt="Wallet Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <a href="${props.first_payment_link || '#'}" target="_blank" id="order_first_payment"></a></div>` 
          : ``}

        ${(props.first_payment_status && props.first_payment_status.toLowerCase() == 'yes')
          ? `<div><img src="./src/ar-ui-icons/status.png" alt="Status Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <span class="payment_status_yes"></span></div>` 
          : `<div><img src="./src/ar-ui-icons/status.png" alt="Status Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <span class="payment_status_no"></span></div>`}
      </div>

      <div class="invoice__container">
        ${props.second_invoice 
          ? `<div><img src="./src/ar-ui-icons/invoice.png" alt="Invoice Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <a href="${props.second_invoice || '#'}" target="_blank" id="order_second_invoice"></a></div>` 
          // : `<span id="order_second_invoice"></span><span id="order_second_invoice2"></span><span id="order_second_invoice3"></span>`}
          : ``}

        ${props.second_payment_link 
          ? `<div><img src="./src/ar-ui-icons/wallet.png" alt="Wallet Icon" style="width: 16px; height: 16px; vertical-align: middle;">
              <a href="${props.second_payment_link || '#'}" target="_blank" id="order_second_payment"></a></div>` 
          : ``}

        ${(props.second_payment_status && props.second_payment_status.toLowerCase() == 'yes')
          ? `<div><img src="./src/ar-ui-icons/status.png" alt="Status Icon" style="width: 16px; height: 16px; vertical-align: middle;">
              <span class="payment_status_yes"></span></div>` 
          : `<div><img src="./src/ar-ui-icons/status.png" alt="Status Icon" style="width: 16px; height: 16px; vertical-align: middle;">
            <span class="payment_status_no"></span></div>`}
      </div>
    </div>
  `;

  // FIELD
  // first_payment_status
  // second_payment_status

  // ID
  // payment_status_yes
  // payment_status_no

  if(!props.first_invoice) {
    if (props.expected_manufactured_date) {
      updateElementText('#order_first_invoice', 'order_first_invoice_null2');
      const invoiceDateString = subtractWeeks(props.expected_manufactured_date, 8);
      const invoiceDate = humanizeDateStrings(invoiceDateString, currentLanguage);
      $('#order_first_invoice2').text(' ' + invoiceDate);
    } else {
      updateElementText('#order_first_invoice', 'order_first_invoice_null');
    }
  }

  if(!props.second_invoice) {
    updateElementText('#order_second_invoice', 'order_second_invoice_null');
  }

  // Shipping Address
  if (props.shipping_address) {
    document.getElementById('shipping-address').innerHTML = `
      <div class="popup__info_title"></div>
      ${props.shipping_address || ''}
    `;
  }

  // Timeline
  timeline = {
    manufacture: getDisplayDate(props.expected_manufactured_date, props.actual_manufactured_date),
    ship: getDisplayDate(props.expected_ship_date, props.actual_ship_date),
    delivery: getDisplayDate(props.expected_delivery_date, props.actual_delivered_date),
  };

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

  updateUIlanguages(dataMain);
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
