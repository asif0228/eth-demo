var loader  = $('#loading');
var content = $('#content');

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  myCoin: null,
  transfer_count:0,
  transaction_count:0,
  isAdmin:false
}

function start(){
  loader.hide();
  //content.hide();

  console.log("Started ...");
  initWeb3();
}

function initWeb3(){
  if (typeof web3 !== 'undefined') {
    // If a web3 instance is already provided by Meta Mask.
    App.web3Provider = web3.currentProvider;
    web3 = new Web3(web3.currentProvider);
  } else {
    // Specify default instance if no web3 instance provided
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    web3 = new Web3(App.web3Provider);
  }
  return initContracts();
}

function initContracts(){
  $.getJSON("MyCoin.json", function(mc) {
    App.contracts.MyCoin = TruffleContract(mc);
    App.contracts.MyCoin.setProvider(App.web3Provider);
  }).done(function() {
    //App.listenForEvents();
    return renderContent();
  })
}

function renderContent() {
  // Load account data
  web3.eth.getCoinbase(function(err, account) {
    if(err === null) {
      App.account = account;
      console.log("Account = "+account);
      $('#wallet').html("Wallet: " + App.account);
    }
  });

  // Load token sale contract
  App.contracts.MyCoin.deployed().then(function(instance) {
    App.myCoin = instance;
    console.log("My Coin Address:", App.myCoin.address);
    return App.myCoin.balanceOf(App.account);
  }).then(function(coin) {
    console.log("Coin = "+coin);
    $("#coin").html(coin+" MyCoin");
    return App.myCoin.allTransactions_count();
  }).then(function(cnt){
    App.transaction_count = cnt;
    console.log("Transaction Count = "+cnt);
    for(var i=App.transaction_count-1;i>=0;i--){
      App.myCoin.allTransactions(i).then(function(txn){
        if(txn[3]==0)
          $('#pending tr:last').after('<tr><td>'+txn[4]+'</td><td>'+txn[2]+'</td><td>'+txn[1]+' <button onclick="acceptRequest('+txn[4]+');" class="btn btn-success">A</button> <button onclick="rejectRequest('+txn[4]+');" class="btn btn-danger">R</button></td></tr>');
        else if(txn[3]==1)
          $('#accepted tr:last').after('<tr><td>'+txn[4]+'</td><td>'+txn[2]+'</td><td>'+txn[1]+'</td></tr>');
        else if(txn[3]==-1)
          $('#rejected tr:last').after('<tr><td>'+txn[4]+'</td><td>'+txn[2]+'</td><td>'+txn[1]+'</td></tr>');
      });
    }
    return App.myCoin.transfer_count();
  }).then(function(cnt){
    App.transfer_count = cnt;
    console.log("Transfer Count = "+cnt);
    for(var i=App.transfer_count-1;i>=0;i--){
      App.myCoin.transfer(i).then(function(txn){
        $('#transfer tr:last').after('<tr><td>'+txn[4]+'</td><td>'+txn[0]+'</td><td>'+txn[2]+'</td><td>'+txn[1]+'</td></tr>');
      });
    }
    return App.myCoin.admin();
  }).then(function(a){
    console.log("Admin : "+a);
    if(App.account==a){
      App.isAdmin = true;
    }
  });

}

function requestCoin(){
  var coin = $("#num_of_coin").val();
  console.log("Requestiong "+coin+" MyCoin");
  App.myCoin.requestCoin(coin).then(function(){
    location.reload();
  });
}

function transferCoin(){
  var to = $("#address").val();
  console.log(to);

  var coin = $("#num_of_coin").val();
  //App.myCoin.transferCoin(coin,to).then(function(){
  //  location.reload();
  //});
}

function acceptRequest(_no){
  if(!App.isAdmin){alert("Only Admin Can Do That.");return;}
  console.log("Acception TxnId : "+_no);
  App.myCoin.acceptTransaction(_no).then(function(){
    location.reload();
  });
}

function rejectRequest(_no){
  if(!App.isAdmin){alert("Only Admin Can Do That.");return;}
  console.log("Rejecting TxnId : "+_no);
  App.myCoin.rejectTransaction(_no).then(function(){
    location.reload();
  });
}


$(function() {
  $(window).load(function() {
    start();
  })
});
