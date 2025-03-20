'use strict';
/* global $ */

import { DATAFILE_CSV_LINK_UI } from './settings.js';

import {
  createUI,
  loadAndParseCSV,
  updateUIlanguages,
  updateElementText,
} from './ui-controller.js';

let dataMain = [];

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
    return;
  }

  const dealData = await fetchDealData(dealId);
  if (!dealData || !dealData.properties) {
    document.querySelector('main').innerHTML = '<p>Data loading error</p>';
    return;
  }

  const props = dealData.properties;
  console.log("🚀 ~ initPage ~ props:", props); //! DEBUG

  // customer-info
  document.getElementById('customer-info').innerHTML = `
    <div class="popup__info_title"></div>
    <div class="popup__info_item">
      <div class="customer_info_title" id="customer_name"></div>
      <div class="customer_info_content">${props.dealname || ''}</div>
    </div>
  `;

  // design-links
  const designs = props.final_designs ? props.final_designs.split(';') : [];
  document.getElementById('design-links').innerHTML = `
    <div class="popup__info_title">Final Designs</div>
    ${designs.length > 0 ? designs.map(link => `<a href="${link}&s=final" target="_blank">${link}</a>`).join('<br>') : 'No designs available'}
  `;

  // invoice-links
  document.getElementById('invoice-links').innerHTML = `
    <a href="${props.first_invoice || '#'}" target="_blank" id="order_first_invoice">First Invoice</a><br>
    <a href="${props.second_invoice || '#'}" target="_blank" id="order_second_invoice">Second Invoice</a>
  `;

  // Timeline
  const timeline = {
    manufacture: getDisplayDate(props.expected_manufactured_date, props.actual_manufactured_date),
    ship: getDisplayDate(props.expected_ship_date, props.actual_shipped_date),
    delivery: getDisplayDate(props.expected_delivery_date, props.actual_delivered_date),
  };

  $('#manufacture_date_title').text(timeline.manufacture.date);
  $('#ship_date_title').text(timeline.ship.date);
  $('#delivery_date_title').text(timeline.delivery.date);

  updateElementText('#manufacture_date_subtitle', 'manufacture_date_subtitle_' + timeline.manufacture.label);
  updateElementText('#manufacture_date_text', 'manufacture_date_text_' + timeline.manufacture.label);
  updateElementText('#ship_date_subtitle', 'ship_date_subtitle_' + timeline.ship.label);
  updateElementText('#ship_date_text', 'ship_date_text_' + timeline.ship.label);
  updateElementText('#delivery_date_subtitle', 'delivery_date_subtitle_' + timeline.delivery.label);
  updateElementText('#delivery_date_text', 'delivery_date_text_' + timeline.delivery.label);

  updateUIlanguages(dataMain);
}

//! **************************************************************

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


//! **************************************************************

