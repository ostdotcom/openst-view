/**
 * Created by Aniket on 08/02/18.
 */
;(function ( window, $) {

  var btx = ns("btx");

  var oThis = btx.addressDetails = {
    config: {},

    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);

      oThis.initDatatable();
    },

    initDatatable: function() {
      var oThis = this;

      var addressTransactions = new TokenTable({
        ajaxURL: oThis.config.transactions_url,
        selector: '#addressDetailsTransactions',
        dtConfig: {
          columns: [
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: data['company_symbol'],
                  name: data['company_name']
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-2').text())({
                  tokens: data.tokens,
                  value: data.ost_amount
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-3').text())({
                  timestamp: moment(data.timestamp * 1000).startOf('day').fromNow()
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-4').text())({
                  tx: data.transaction_hash,
                  redirect_url: data.tx_redirect_url

                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-5').text())({
                  from: data.address,
                  redirect_url: data.from_redirect_url

                });
              }
            },
            {
              data: null,
              className: 'arrow',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-6').text());
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-7').text())({
                  to: data.corresponding_address,
                  redirect_url: data.to_redirect_url

                });
              }
            }
          ]
        },

        responseReceived : function ( response ) {
          var dataToProceess = response.data[response.data.result_type]
            , meta = response.data.meta
            , contractAddresses = response.data['contract_addresses']
            ;

          dataToProceess.forEach(function (element) {
            var txHash = element.transaction_hash
             , from = element.address
             , to = element.corresponding_address
              , txURL = meta.transaction_placeholder_url
              , addressURL = meta.address_placeholder_url
              , contarct_address = element.contract_address
              ,tokens = element.tokens
            ;



            element['tx_redirect_url'] = Handlebars.compile(txURL)({
              tr_hash: txHash
            });

            element['from_redirect_url'] = Handlebars.compile(addressURL)({
              addr: from
            });
            element['to_redirect_url'] = Handlebars.compile(addressURL)({
              addr: to
            });

            element['ost_amount'] = tokens/ contractAddresses[contarct_address].price;

            element['company_name'] = contractAddresses[contarct_address].company_name;
            element['company_symbol'] = contractAddresses[contarct_address].company_symbol;

          });
        }
      });
    }

  }
})(window, jQuery);