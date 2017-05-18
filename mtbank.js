"use strict";
/* global chrome:false */

/**
 * Convert number to formatted string
 * Example:
 * numberFormat(1000.12, 3, ",", " ") // "1 000,120"
 *
 * @param {String|Number} number
 * @param {Number} [decimals=2]
 * @param {String} [decimal_separator="."]
 * @param {String} [thousands_separator=","]
 * @returns {String}
 */
function numberFormat(number, decimals, decimal_separator, thousands_separator) {
    number = +number;

    if(Number.isNaN(number)) {
        return '0';
    }

    if(typeof decimal_separator !== 'string') {
        decimal_separator = '.';
    }
    if(typeof thousands_separator !== 'string') {
        thousands_separator = ',';
    }

    var c = decimals === -1 ?
            (number.toString().split('.')[1] || '').length : // preserve decimals
            (Number.isNaN(decimals = Math.abs(decimals)) ? 2 : decimals),
        s = number < 0 ? "-" : "",
        i = String(parseInt(number = Math.abs(number).toFixed(c))),
        j = i.length > 3 ? i.length % 3 : 0;

    return s + (j ? i.substr(0, j) + thousands_separator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_separator) +
        (c ? decimal_separator + Math.abs(number - i).toFixed(c).slice(2) : "");
}

/**
 *
 * @param   {string}    number
 * @returns {number}
 */
function toNumber(number) {
    var sum = number
        .replace(/\s|\'/g, '')
        .replace(/,/g, '.');

    return Number.isNaN(+sum)?
        sum :
        +sum;
}

/**
 *
 * @param   {string}    number
 * @returns {NumberSeparators}
 */
function numberSeparators(number) {
    var separators = number.match(/(\d{1,3}([^\d])?)*?\d{1,3}([.,])\d+/);

    return separators ?
        {
            thousands: separators[2] || '',
            decimals: separators[3] || '.'
        } :
        {
            thousands: '',
            decimals: '.'
        };
}

/**
 *
 * @param   {NodeList}  dom_items
 * @returns {Array.<HTMLElement>}
 */
function destructure(dom_items) {
    return [].slice.apply(dom_items);
}

var RATE_TEMPLATE =
    '<tr class="rate-box $0">' +
        '<td>' +
            '<div class="summ balance">$1</div>' +
        '</td>' +
        '<td>' +
            '<div class="currency">$2</div>' +
        '</td>' +
    '</tr>';

/**
 *
 * @param {Element} card_box
 * @param {Rate}    rate_data
 */
function fill_rate(card_box, rate_data) {
    var convert_currency = rate_data.currency;
    var balance = card_box.querySelector('.balance').textContent;
    var separators = numberSeparators(balance);

    console.log(toNumber(balance) / rate_data.cell);

    card_box.querySelector('.balance-table tbody').innerHTML += RATE_TEMPLATE
        .replace('$0', convert_currency.toLowerCase())
        .replace('$1', numberFormat(
            toNumber(balance) / rate_data.cell,
            2, separators.decimals, separators.thousands
        ))
        .replace('$2', convert_currency);
}

/**
 *
 */
function initializeCurrencies() {
    /**
     * Table of BYN and EUR/USD conversions
     *
     * @type {NodeList}
     */
    var conversation_table = document.querySelectorAll('.conversion-table tr td');

    /**
     *
     * @type {Object.<string, Rate>}
     */
    var rates = {};
    var items = destructure(conversation_table);

    for(var i = 0; i < items.length; i += 3) {
        var name = items[i].textContent;

        var rate_buy = items[i + 1];
        var rate_cell = items[i + 2];

        rates[name] = {
            currency: name,
            buy: toNumber(rate_buy.textContent),
            cell: toNumber(rate_cell.textContent)
        };
    }

    /**
     * Cards, deposits etc
     *
     * @type {NodeList}
     */
    var product_boxes = document.querySelectorAll('.product-body');

    destructure(product_boxes).forEach(function(card_box) {
        var currency = card_box.querySelector('.currency').textContent;

        switch (currency) {
            case 'BYN':
                fill_rate(card_box, rates.USD);
                fill_rate(card_box, rates.EUR);
                break;

            case 'USD':
                fill_rate(card_box, {
                    currency: 'BYN',
                    buy: 1 / rates.USD.cell,
                    cell: 1 / rates.USD.buy
                });

                fill_rate(card_box, {
                    currency: 'EUR',
                    buy: rates["EUR/USD"].cell,
                    cell: rates["EUR/USD"].buy
                });
                break;

            case 'EUR':
                fill_rate(card_box, {
                    currency: 'BYN',
                    buy: 1 / rates.EUR.cell,
                    cell: 1 / rates.EUR.buy
                });

                fill_rate(card_box, {
                    currency: 'USD',
                    buy: rates["EUR/USD"].buy,
                    cell: rates["EUR/USD"].cell
                });
                break;
        }
    });
}

if (document.querySelector('#products-content')) {
    initializeCurrencies();
} else {
    document.addEventListener("DOMContentLoaded", initializeCurrencies);
}
