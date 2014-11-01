package main

import (
	"database/sql"
	"fmt"
	"github.com/conformal/btcec"
	"github.com/conformal/btcnet"
	"github.com/conformal/btcutil"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"log"
	"net/http"
)

var (
	curNet = &btcnet.MainNetParams
)

func main() {
	_, err := sql.Open("postgres", "")
	if err != nil {
		log.Fatalln("no open db")
	}

	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler)
	http.Handle("/", r)

	log.Fatal(http.ListenAndServe(":8080", nil))

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
