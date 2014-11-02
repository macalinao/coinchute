package main

import (
	"code.google.com/p/go-uuid/uuid"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/conformal/btcec"
	"github.com/conformal/btcnet"
	"github.com/conformal/btcutil"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
	"time"
)

const (
	hostname = "http://localhost:8080/"
)

var (
	curNet             = &btcnet.MainNetParams
	noRecordExistError = errors.New("the resource doesn't exist")

	database Store = NewMemStore()
)

func writeJson(w http.ResponseWriter, m interface{}) {
	if err := json.NewEncoder(w).Encode(m); err != nil {
		log.Fatalln("could not write response")
	}
}

type Store interface {
	GetAccount(uuid string) (error, *Account)
	AddAccount(acct *Account) error
	ListAccounts() (error, []*Account)

	GetSubscription(uuid string) (error, *Subscription)
	AddSubscription(sub *Subscription) error
	ListSubscriptions() (error, []*Subscription)
}

type MemStore struct {
	accounts      []*Account
	subscriptions []*Subscription
}

func NewMemStore() *MemStore {
	return &MemStore{
		accounts:      []*Account{},
		subscriptions: []*Subscription{},
	}
}

func (ms *MemStore) GetAccount(uuid string) (error, *Account) {
	for _, acct := range ms.accounts {
		if acct.UUID.String() == uuid {
			return nil, acct
		}
	}

	return noRecordExistError, nil
}

func (ms *MemStore) AddAccount(acct *Account) error {
	ms.accounts = append(ms.accounts, acct)
	return nil
}

func (ms *MemStore) ListAccounts() (error, []*Account) {
	return nil, ms.accounts
}

func (ms *MemStore) GetSubscription(uuid string) (error, *Subscription) {
	for _, sub := range ms.subscriptions {
		if sub.UUID.String() == uuid {
			return nil, sub
		}
	}

	return noRecordExistError, nil
}

func (ms *MemStore) AddSubscription(sub *Subscription) error {
	ms.subscriptions = append(ms.subscriptions, sub)
	return nil
}

func (ms *MemStore) ListSubscriptions() (error, []*Subscription) {
	return nil, ms.subscriptions
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler)

	r.HandleFunc("/subscriptions", newSubscriptionHandler).Methods("POST")
	r.HandleFunc("/subscriptions/{subUUID}", getSubscriptionHandler).Methods("GET")

	r.HandleFunc("/request", requestPaymentHandler).Methods("POST")

	r.HandleFunc("/accounts/{acctUUID}", getAccountHandler).Methods("GET")
	r.HandleFunc("/accounts/{acctUUID}/addresses", createNewAccountDepAddr).Methods("POST")
	r.HandleFunc("/accounts/{acctUUID}/addresses", listAccountAddrsHandler).Methods("GET")

	http.Handle("/", r)
	seed()

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func seed() {
	na := NewAccount()
	database.AddAccount(na)
	fmt.Println(na.UUID)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "pullcoin api says hi")
}

// POST
// payment_address
// subscription_id
// price
func requestPaymentHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		log.Fatalln("could not parse form")
		return
	}

	addr := r.PostForm.Get("address")
	sub_id := r.PostForm.Get("subscription_uuid")

	fmt.Println(addr)
	fmt.Println(sub_id)
}

type Account struct {
	UUID uuid.UUID

	DepositAddresses []btcutil.Address

	UnconfirmBal int64 `json:"unconfirmed_balance"`
	SafeBal      int64 `json:"confirmed_balance"`

	Subscriptions []*Subscription
	CreatedAt     time.Time
}

func (a *Account) NetBal() int64 {
	return a.UnconfirmBal + a.SafeBal
}

func (a *Account) GenDepositAddr() (error, btcutil.Address) {
	pk, err := btcec.NewPrivateKey(btcec.S256())
	if err != nil {
		return errors.New("cannot generate private key"), nil
	}

	wif, err := btcutil.NewWIF(pk, curNet, true)
	if err != nil {
		return errors.New("cannot generate wallet import format"), nil
	}

	addr, err := btcutil.NewAddressPubKey(wif.SerializePubKey(), curNet)
	if err != nil {
		return errors.New("cannot generate addr from pub key"), nil
	}

	a.DepositAddresses = append(a.DepositAddresses, addr)

	return nil, addr
}

func NewAccount() *Account {
	return &Account{
		UUID:             uuid.NewUUID(),
		CreatedAt:        time.Now(),
		DepositAddresses: []btcutil.Address{},
	}
}

func createNewAccountDepAddr(w http.ResponseWriter, r *http.Request) {
	uuid := mux.Vars(r)["acctUUID"]

	err, acct := database.GetAccount(uuid)
	if err != nil {
		log.Fatalln("could not get account")
		return
	}

	err, addr := acct.GenDepositAddr()
	if err != nil {
		log.Fatalln("couldn't generate addr")
	}

	writeJson(w, map[string]string{
		"address": addr.EncodeAddress(),
	})
}

func listAccountAddrsHandler(w http.ResponseWriter, r *http.Request) {
	uuid := mux.Vars(r)["subUUID"]

	err, acct := database.GetAccount(uuid)
	if err != nil {
		log.Fatalln("could not get account")
		return
	}

	writeJson(w, map[string]interface{}{
		"addresses": acct.DepositAddresses,
	})
}

func getAccountHandler(w http.ResponseWriter, r *http.Request) {
	uuid := mux.Vars(r)["acctUUID"]

	err, acct := database.GetAccount(uuid)
	if err != nil {
		log.Fatalln("coul dnot get user acct")
		return
	}

	sd := []string{}
	for _, ad := range acct.DepositAddresses {
		sd = append(sd, ad.EncodeAddress())
	}

	s := map[string]interface{}{
		"uuid":                acct.UUID,
		"deposit_addresses":   sd,
		"unconfirmed_balance": acct.UnconfirmBal,
		"confirmed_balance":   acct.SafeBal,
		"created_at":          acct.CreatedAt,
		"subscriptions":       []*Subscription{},
	}

	writeJson(w, s)
}

type Transaction struct {
	UUID uuid.UUID `json:"uuid"`

	subscription *Subscription

	quantity   int64
	to_address btcutil.Address

	createdAt time.Time
}

type Subscription struct {
	UUID         uuid.UUID      `json:"uuid"`
	CreatedAt    time.Time      `json:"created_at"`
	Transactions []*Transaction `json:"-"`

	Account *Account

	MerchantName string `json:"merchant_name"`
	Active       bool   `json:"active"`
	Item         string `json:"name"`
	Amount       int64  `json:"amount"`
	Interval     string `json:"interval"`
}

func NewSubscription(merchName string, item string, amount int64, interval string) *Subscription {
	return &Subscription{
		UUID:      uuid.NewUUID(),
		CreatedAt: time.Now(),

		MerchantName: merchName,
		Item:         item,
		Amount:       amount,
		Interval:     interval,
	}
}

func newSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		fmt.Println(err)
		return
	}

	merchName := r.PostForm.Get("merchant_name")
	item := r.PostForm.Get("item")
	amount := r.PostForm.Get("amount")
	interval := r.PostForm.Get("interval")

	p, err := strconv.Atoi(amount)
	if err != nil {
		fmt.Println(err)
		return
	}

	sub := NewSubscription(merchName, item, int64(p), interval)
	database.AddSubscription(sub)

	writeJson(w, sub)
}

func getSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	uuid := mux.Vars(r)["subUUID"]

	if err, sub := database.GetSubscription(uuid); err != nil {
		writeJson(w, sub)
	}
}
