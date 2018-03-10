"use strict"
/**
 * Model to fetch all address related details from database or from chain.
 *
 * @module models/address
 */

// load all internal dependencies
const rootPrefix = ".."
  , rpcInteract = require(rootPrefix + '/lib/web3/interact/rpc_interact')
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
  , configHelper = require(rootPrefix + '/helpers/configHelper')
;

const und = require('underscore');

/**
 * @constructor
 *
 * @param  {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var address = module.exports = function (chainId) {
  this._utilityInteractInstance = rpcInteract.getInstance(chainId);
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
};

address.prototype = {

  /**
   * This method servers available balance of address on RPC value chain.
   *
   * @param {String} address - Address
   *
   * @return {Promise<Integer>}  Available balance of address.
   */
  getAddressBalance: function (address) {
    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
        reject('invalid input');
        return;
      }

      oThis._dbInstance.getBalance(address)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   * Get transactions of a particular address in batches from database.
   *
   * @param {String} address - Address
   * @param {Integer} page - Page number for getting data in batch.

   * @return {Promise<Object>} transactions of address which are available in database.
   */
  , getAddressTransactions: function (address, page) {

    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }
      oThis._dbInstance.getAddressTransactions(address, page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   * Fetches transactions from database done from particular user in given contract in batches.
   *
   * @param  {String} address - address
   * @param  {String} contractAddress - Contract address
   * @param  {Integer} page - page number
   *
   * @return {promise<Object>}  List of transactions available in database for particular batch.
   */
  , getAddressLedgerInContract: function (address, contractAddress, page) {
    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid address");
        return;
      }

      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid contract address");
        return;
      }

      if (page == undefined || !page || isNaN(page) || page < 1) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }
      oThis._dbInstance.getAddressLedgerOfContract(address, contractAddress, page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   * Fetches token transactions from database done from particular address in batches.
   *
   * @param  {String} address - address
   * @param  {Integer} page - page number
   *
   * @return {promise<Object>}  list of token transactions available in database for particular batch.
   */
  , getAddressTokenTransactions: function (address, pageSize, pagePayload) {
    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getAddressTokenTransactions(address, pageSize, pagePayload)
        .then(function (response) {
          var contractArray = [];
          response.forEach(function(object){
            contractArray.push(object.contract_address);
          });
          contractArray = und.uniq(contractArray);
          return configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, contractArray)
            .then(function(addressHash){
               resolve({tokenTransactions: response, contractAddress: addressHash});
            });

        })
        .catch(function (reason) {
          reject(reason);
        });

    });
  }

  , getAddressDetails: function (address){
    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }
      var promiseResolver = [];

      promiseResolver.push(oThis._dbInstance.getAddressDetailsWithOutOST(address));
      promiseResolver.push(oThis._dbInstance.getAddressDetailsTotalTransactionCount(address));

      Promise.all(promiseResolver)
        .then(function(values){
          var addressDetails = values[0]
            , total_transactions = values[1]
            ;

          if(undefined !== addressDetails){
            addressDetails.total_transactions = total_transactions;

            configHelper.getContractDetailsOfIdArray(oThis._dbInstance, [addressDetails['branded_token_id']])
              .then(function(addressHash){

                resolve({addressDetails: addressDetails, contractAddress: addressHash});
              })
              .catch(function(){

                resolve({addressDetails: addressDetails});
              });
          }else{
            resolve();
          }
        })
        .catch(function(reason){
          reject(reason);
        });
    });
  }

};
