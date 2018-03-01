"use strict"
/**
 * Model to fetch contract address related details from database or from chain.
 *
 * @module models/contract
 */

// load all internal dependencies
const rootPrefix = ".."
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
  , configHelper = require(rootPrefix + '/helpers/configHelper')
  , memCache = require(rootPrefix + '/helpers/memCache')
;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var contract = module.exports = function (chainId) {
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
};

contract.prototype = {

  /**
   * Get list of Contract ledger for given contract address.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} page  - Page number
   *
   * @return {Promise<Object>} List of contract internal transaction
   */
  getContractLedger: function (contractAddress, page) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getContractLedger(contractAddress, page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });

    });
  },

  /**
   * Get list of Contract ledger for given contract address.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} page  - Page number
   *
   * @return {Promise<Object>} List of contract transaction
   */
  getContractTransactions: function (contractAddress, page) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getContractTransactions(contractAddress, page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  },

  /**
   * Get graph data for value of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  getGraphDataOfBrandedTokenValueTransactions: function (contractAddress, duration) {
    const oThis = this;

    if (contractAddress == undefined) {
      return Promise.reject("invalid input");
    }

    if (duration == undefined ) {
      duration = "All";
    }

    return memCache.get("getGraphDataOfBrandedTokenValueTransactions" + contractAddress + duration)
        .then(function(cacheResponse){
          if (!cacheResponse.isSuccess()) {
            return oThis._dbInstance.getGraphDataOfBrandedTokenValueTransactions(contractAddress)
                .then(function (response) {
                  return memCache.set("getGraphDataOfBrandedTokenValueTransactions" + contractAddress + duration, response[duration])
                      .then(function(){
                        return Promise.resolve(response[duration]);
                      });
                })
                .catch(function (reason) {
                  return Promise.reject(reason);
                });

          } else {
            return Promise.resolve(cacheResponse.data.response);
          }
        });
  },


  /**
   * Get graph data for values and number of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  getValuesAndVolumesOfBrandedTokenTransactions: function (contractAddress, duration) {
    const oThis = this;

    if (contractAddress == undefined) {
      return Promise.reject("invalid contract address");
    }

    if (duration == undefined ) {
      duration = "All";
    }

    return memCache.getObject("getValuesAndVolumesOfBrandedTokenTransactions" + contractAddress + duration)
        .then(function(cacheResponse){
            if (!cacheResponse.isSuccess() || cacheResponse.data.response == null) {
                return configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
                  .then(function (contractId) {
                    return oThis._dbInstance.getValuesAndVolumesOfBrandedTokenTransactions(contractId)
                      .then(function (response) {
                        return memCache.setObject("getValuesAndVolumesOfBrandedTokenTransactions" + contractAddress + duration, response[duration])
                          .then(function(){
                            if (response[duration] !== undefined) {
                              return Promise.resolve(response[duration]);
                            } else {
                              return Promise.resolve([]);
                            }
                          });
                      })
                      .catch(function (reason) {
                        return Promise.reject("Data not available. Please check the input parameters.");
                      });
                  });
            } else {
                return Promise.resolve(cacheResponse.data.response);
            }
        });
  },

  /**
   * Get branded token Id graph data for transaction by type.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract transactions by type
   */
  getGraphDataForBrandedTokenTransactionsByType: function (contractAddress, duration) {
    const oThis = this;

    if (contractAddress == undefined) {
      return Promise.reject("invalid input");
    }

    if (duration == undefined) {
      duration = "All";
    }

    return memCache.getObject("getGraphDataForBrandedTokenTransactionsByType" + contractAddress + duration)
      .then(function (cacheResponse) {
        if (!cacheResponse.isSuccess() || cacheResponse.data.response == null) {
          return configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
            .then(function (contractId) {
              return oThis._dbInstance.getDataForBrandedTokenTransactionsByType(contractId)
                .then(function (response) {
                  return memCache.setObject("getGraphDataForBrandedTokenTransactionsByType" + contractAddress + duration, response[duration])
                    .then(function () {
                      if (response[duration] !== undefined) {
                        return Promise.resolve(response[duration]);
                      } else {
                        return Promise.resolve([]);
                      }
                    });
                })
                .catch(function (reason) {
                  return Promise.reject("Data not available. Please check the input parameters.");
                });
            });
        } else {
          return Promise.resolve(cacheResponse.data.response);
        }
      });
  },

  /**
   * Get top users in contract address.
   *
   * @return {Promise<Object>} List of top users in contract address
   *
   */
  getBrandedTokenTopUsers: function (contractAddress, topUsersCount) {
    const oThis = this;

    if (contractAddress == undefined) {
      return Promise.reject("invalid input");
    }

    return memCache.get("getBrandedTokenTopUsers" + contractAddress + topUsersCount)
      .then(function (cacheResponse) {
        if (!cacheResponse.isSuccess() || cacheResponse.data.response == null) {
          return configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
            .then(function (contractId) {
              return oThis._dbInstance.getBrandedTokenTopUsers(contractId, topUsersCount);
            })
            .then(function (response) {
              return memCache.set("getBrandedTokenTopUsers" + contractAddress + topUsersCount, response)
                .then(function () {
                  return Promise.resolve(response);
                });
            })
            .catch(function (reason) {
              return Promise.reject("Data not available. Please check the input parameters.");
            });
        } else {
          return Promise.resolve(cacheResponse.data.response);
        }
      });
  },

  /**
   * Get top users in contract address.
   *
   * @return {Promise<Object>} List of top users in contract address
   */
  getOstSupply: function (contractAddress) {
    const oThis = this;

      if (contractAddress == undefined) {
          return Promise.reject("invalid input");
      }

      return memCache.get("getOstSupply" + contractAddress)
          .then(function(cacheResponse) {
              if (cacheResponse.isSuccess() && cacheResponse.data.response == null) {
                  return configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
                      .then(function(contractId) {
                          return oThis._dbInstance.getOstSupply(contractId);
                      })
                      .then(function(response) {
                          return memCache.set("getOstSupply" + contractAddress, response)
                              .then(function(){
                                  console.log("getOstSupply DB response", response);
                                  return Promise.resolve(response);
                              });
                      });
              } else {
                  console.log("getOstSupply Cached response", cacheResponse.data.response);
                  return Promise.resolve(cacheResponse.data.response);
              }
          });
  }

};
