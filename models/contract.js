"use strict";
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
  , TokenUnits = require(rootPrefix + '/helpers/tokenUnits')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , und = require('underscore')
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
  getContractLedger: function (contractAddress, pageSize, pagePayload) {
    const oThis = this;

    return new Promise(function (resolve, reject) {
      if (contractAddress === undefined) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getContractLedger(contractAddress, pageSize, pagePayload)
        .then(function(response){
          var contractArray = [];
          response.forEach(function(object){
            contractArray.push(object.contract_address);
          });
          contractArray = und.uniq(contractArray);
          return configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, contractArray)
            .then(function(addressHash){
              resolve({contractTransactions: response, contractAddress: addressHash});
            });

        })
        .catch();
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
      .then(function (cacheResponse) {
        if (!cacheResponse.isSuccess()) {
          return oThis._dbInstance.getGraphDataOfBrandedTokenValueTransactions(contractAddress)
            .then(function (response) {
              return memCache.set("getGraphDataOfBrandedTokenValueTransactions" + contractAddress + duration, response[duration])
                .then(function () {
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

    if (duration == undefined) {
      duration = "All";
    }

    return memCache.getObject("getValuesAndVolumesOfBrandedTokenTransactions" + contractAddress + duration)
      .then(function (cacheResponse) {
        if (!cacheResponse.isSuccess() || cacheResponse.data.response == null) {
          return configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
            .then(function (contractId) {
              return oThis._dbInstance.getValuesAndVolumesOfBrandedTokenTransactions(contractId)
                .then(function (response) {
                  if (response[duration] !== undefined) {
                    return memCache.setObject("getValuesAndVolumesOfBrandedTokenTransactions" + contractAddress + duration, response[duration])
                      .then(function () {
                        return Promise.resolve(response[duration]);
                      });
                  } else {
                    return Promise.resolve([]);
                  }
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
                  if (response[duration] !== undefined) {
                    return memCache.setObject("getGraphDataForBrandedTokenTransactionsByType" + contractAddress + duration, response[duration])
                      .then(function () {
                        return Promise.resolve(response[duration]);
                      });
                  } else {
                    return Promise.resolve([]);
                  }
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

  , getTokenDetails: function (contractAddress) {
    const oThis = this;
    return new Promise(function (resolve, reject) {

      if (!contractAddress) {
        return(reject("invalid input"));
      }

      oThis._dbInstance.getCoinFromContractAddress(contractAddress)
        .then(function (response) {
          if(!response){
            return(reject("invalid input"));
          }
          configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
            .then(function (brandedTokenId) {
              oThis._dbInstance.getTokenStatsData(brandedTokenId)
                .then(function (stateResponse) {

                  var transfers  = stateResponse.token_transfers == undefined? 0: stateResponse.token_transfers
                    , volume = stateResponse.token_volume == undefined? 0: stateResponse.token_volume
                  ;

                  response["token_transfers"] = transfers;
                  response["token_volume"] = TokenUnits.convertToNormal(volume);

                    configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, [contractAddress])
                    .then(function(addressHash){
                      response["contractAddresses"] = addressHash;
                      resolve(response);
                    })
                    .catch(function(){

                      resolve(response);
                    })

                }, reject);
            }, reject);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }


  ,getTokenDetailsInfo: function(token_details){
    var details = [
      {
        img:"market-cap",
        title:"Market Cap",
        value: TokenUnits.toBigNumber(token_details['market_cap']).toFormat(0),
        is_badge_visible:true
      },
      //{
      //  img:"circulating-supply",
      //  title:"Circulating Supply",
      //  value: TokenUnits.toBigNumber(token_details['circulation']).toFormat(0),
      //  is_badge_visible:false
      //},
      {
        img:"total-supply",
        title:"Total Supply",
        value: TokenUnits.convertToNormal(token_details['total_supply']).toFormat(0),
        is_badge_visible:false
      }
    ];
    return details;
  },

  getTokenStats: function (chain_data) {
    var details = {
      token_transfers: TokenUnits.toBigNumber(chain_data['token_transfers']).toFormat(0),
      token_volume: TokenUnits.toBigNumber(chain_data['token_volume']).toFormat(0)
    };

    return details;
  }

  , getTokenHolders: function(contractAddress, pageSize, pagePaylaod) {
    const oThis = this;
    return new Promise(function (resolve, reject) {

      if (contractAddress === undefined) {
        reject("invalid input");
      }
      configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
        .then(function (contractId) {

          oThis._dbInstance.getAddressesWithBrandedToken(contractId, pageSize, pagePaylaod)
            .then(function (response) {
              configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, [contractAddress])
                .then(function(addressHash){
                  resolve({tokenHolders: response, contractAddress: addressHash});
                });
            })
            .catch(function (addressesFailed) {
              reject(addressesFailed);
            });
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }



  /**
   * Get graph data for number of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  ,getGraphDataOfNumberOfBrandedTokenTransactions : function(contractAddress, duration){
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress === undefined) {
        reject("invalid input");
        return;
      }

      if (duration === undefined ) {
        duration = "All";
      }

      oThis._dbInstance.getGraphDataForBrandedTokenTransactions(contractAddress)
        .then(function (response) {
          if (response !== undefined && typeof response === 'object' &&  Object.keys(response).length > 0){
            resolve(response[duration]);
          }else{
            resolve();
          }
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   *Get recent token transactions available on utility chain.
   *
   *@return {Promise<Object>} List of pending transactions.
   */
    ,getRecentTokenTransactions : function(pageSize, pagePaylaod){
    const oThis = this;

    return oThis._dbInstance.getRecentTokenTransactions(pageSize, pagePaylaod)
      .then(function(response){
          var contractArray = [];
          response.forEach(function(object){
            contractArray.push(object.contract_address);
          });
          contractArray = und.uniq(contractArray);
          return configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, contractArray)
            .then(function(addressHash){
                return Promise.resolve({tokenTransactions: response, contractAddress: addressHash});
            });

      })
      .catch();
  }

  /**
   *Get list top tokens available on utility chain.
   *
   *@return {Promise<Object>} List of pending transactions.
   */
  ,getTopTokens : function(pageSize, pagePayload){
    const oThis = this;

    return new Promise(function (resolve, reject) {
      oThis._dbInstance.getTopTokens(pageSize, pagePayload)
        .then(function(queryResponse){
            var pageNumber = (pagePayload && !isNaN(parseInt(pagePayload.page_no))) ? parseInt(pagePayload.page_no) : 1;
            var startRank = ((pageNumber-1)*(pageSize-1)+1);
            queryResponse.forEach(function(element) {
              element['rank'] = startRank;
              startRank++;
            });
          resolve(queryResponse);
        })
        .catch(function(reason){
          reject(reason);
        });
    });
  }

};
