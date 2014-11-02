package main

import (
	"code.google.com/p/go-uuid/uuid"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/conformal/btcec"
	"github.com/conformal/btcnet"
	"github.com/conformal/btcutil"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"log"
	"net/http"
	"time"
)

const (
	hostname = "http://localhost:8080/"
)

var (
	curNet        = &btcnet.MainNetParams
	subscriptions = []*Subscription{}
)

func main() {
	_, err := sql.Open("postgres", "")
	if err != nil {
		log.Fatalln("no open db")
	}

	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler)
	r.HandleFunc("/subscriptions", newSubscriptionHandler).Methods("POST")
	r.HandleFunc("/subscriptions/{subUUID}", getSubscriptionHandler).Methods("GET")

	http.Handle("/", r)

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func writeJson(w http.ResponseWriter, m interface{}) {
	if err := json.NewEncoder(w).Encode(m); err != nil {
		log.Fatalln("could not write response")
	}
}

type Subscription struct {
	UUID      uuid.UUID `json:"uuid"`
	CreatedAt time.Time `json:"created_at"`

	Active       bool
	MerchantID   string `json:"merchant_id"`
	MerchantName string `json:"merchant_name"`
	Name         string `json:"name"`
	Quantity     int64  `json:"quantity"`
	Interval     string `json:"interval"`
}

type NewSubRequest struct {
	Subscription
}

type SubscriptionResponse struct {
	*Subscription
	Link string `json:"link"`
}

func NewSubResponse(sub *Subscription) *SubscriptionResponse {
	fmt.Println(sub.UUID.String())
	link := hostname + "subscriptions/" + sub.UUID.String()
	return &SubscriptionResponse{sub, link}
}

func NewSubscription(merchId string, merchName string, name string, qty int64, interval string) *Subscription {
	return &Subscription{
		UUID:         uuid.NewUUID(),
		CreatedAt:    time.Now(),
		MerchantID:   merchId,
		MerchantName: merchName,
		Name:         name,
		Quantity:     qty,
		Interval:     interval,
	}
}

func newSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	var subr NewSubRequest
	if err := json.NewDecoder(r.Body).Decode(&subr); err != nil {
		log.Fatalln("unable to decode json")
		return
	}

	sub := NewSubscription(subr.MerchantID, subr.MerchantName, subr.Name, subr.Quantity, subr.Interval)

	if sub.MerchantID == "" || sub.MerchantName == "" ||
		sub.Name == "" || sub.Quantity == 0 {
		fmt.Fprintln(w, "validation error this is not json")
		return
	}

	subscriptions = append(subscriptions, sub)

	writeJson(w, NewSubResponse(sub))
}

func getSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	uuid := mux.Vars(r)["subUUID"]

	for _, sub := range subscriptions {
		if sub.UUID.String() == uuid {
			writeJson(w, NewSubResponse(sub))
			return
		}
	}
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	pk, err := btcec.NewPrivateKey(btcec.S256())
	if err != nil {
		log.Fatalln("cannot generate private key")
	}

	wif, err := btcutil.NewWIF(pk, curNet, true)
	if err != nil {
		log.Fatalln("cannot generate wallet import format")
	}

	spub := wif.SerializePubKey()

	addr, err := btcutil.NewAddressPubKey(spub, curNet)
	if err != nil {
		log.Fatalln("cannot generate addr from pub key")
	}

	fmt.Fprintln(w, addr.EncodeAddress())
}
