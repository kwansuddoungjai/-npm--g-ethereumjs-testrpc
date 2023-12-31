const expect = require("@truffle/expect");
const DeferredChain = require("./src/deferredchain");
const Deployment = require("./src/deployment");
const link = require("./src/actions/link");
const create = require("./src/actions/new");
const ENS = require("./ens");

class Deployer extends Deployment {
  constructor(options) {
    expect.options(options, ["provider", "networks", "network", "network_id"]);
    super(options);

    this.options = options;
    this.chain = new DeferredChain();
    this.network = options.network;
    this.networks = options.networks;
    this.network_id = options.network_id;
    this.provider = options.provider;
    this.known_contracts = {};
    if (options.ens && options.ens.enabled) {
      //HACK: use getter to get what we want and put it where we want
      options.ens.registryAddress = options.ensRegistry.address;
      this.ens = new ENS({
        provider: options.provider,
        networkId: options.network_id,
        ens: options.ens
      });
    }

    (options.contracts || []).forEach(
      contract => (this.known_contracts[contract.contract_name] = contract)
    );
  }

  // Note: In all code below we overwrite this.chain every time .then() is used
  // in order to ensure proper error processing.
  start() {
    return this.chain.start();
  }

  link(library, destinations) {
    return this.queueOrExec(link(library, destinations, this));
  }

  deploy() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();
    return this.queueOrExec(this.executeDeployment(contract, args, this));
  }

  new() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    return this.queueOrExec(create(contract, args, this));
  }

  then(fn) {
    return this.queueOrExec(function () {
      return fn(this);
    });
  }

  queueOrExec(fn) {
    return this.chain.started == true
      ? new Promise(accept => accept()).then(fn)
      : this.chain.then(fn);
  }

  finish() {
    this.close();
  }
}

module.exports = Deployer;
