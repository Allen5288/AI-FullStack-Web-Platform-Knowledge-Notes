# Linux Basic knowledge

## ✅ **LINUX – Step 1: Core Concepts**

🧠 Fundamental Concepts You Must Know

- **Filesystem hierarchy**
  - `/bin`(binary), `/etc`(config file), `/home`, `/var`(log file), `/proc`, `/dev`, `/tmp`, `/usr`, `/root` `/boot`(linux kernal itself) , `/dev` (external device like drive)
- **File permissions**
  - `r` (read), `w` (write), `x` (execute)
  - User, group, others
- **File types**
  - Regular file, directory, symlink, device file, etc.
- **Processes**
  - Foreground/background jobs, killing a process
- **Pipes and redirection**
  - `|`, `>`(redirect), `>>`(append), `<`

---

## 🔧 **LINUX – Step 2: Command Cheatsheet**

| Task | Command |
| --- | --- |
| Show current directory | `pwd` |
| List files | `ls -l`(with detail), `ls -a` (list hidden) `-h`(human readable) |
| Change directory | `cd`(~to home) |
| Copy/move/delete files | `cp`(-r for dir), `mv`(rename or move place), `rm` |
| View file contents | `cat`, `less`(view by page), `more`, `head`, `tail` |
| Last 15 lines | `tail -n 15 filename.txt` |
| Find string in file | `grep "term" filename` |
| Find file by name | `find . -name "file.txt"`
find . -name "*.js” (. is current dir, / is searching anywhere) |
| File permissions | `chmod`, `chown`(change owner)
all user read: chmod a+r data.csv |
| Show processes | `ps aux`, `top`, `htop`
ps aux --sort=-%mem | head |
| Kill process | `kill PID`(sigterm 15, process clean up), `kill -9 PID`(forcibly terminates immediately) |
| Symbolic link | `ln -s source target` |
| Current user | `whoami`, `id -u`(see uid) |
| Switch user | `su username`, `sudo -i` |
| Disk usage | `df -h`, `du -sh folder/` |
| System info | `uname -a`, `uptime` |
| What's in `/proc` | Virtual info about processes, CPU, memory |
| print | `echo` “xxxx”  |
| information search | `man` for information |
| create | `mkdir` `touch` |
| export variable | `export` |
| find things | `grep`(-i case sensitive; -r recursively search file in dir)  |
| count lines, words, charaters | `wc`(-l xx.txt count lines) |
| sort lines | `sort` |
| unique things | `uniq` (sort xxx.txt | uniq) |
| extract sections | `cut` |
| extract and replace | `awk`, `sed` |
| Ip Info | `ip addr`, `ifconfig` |
| connect remote server | `ssh username@remote_host` |
| admin task | `sudo` |

---

## 🔧 **LINUX – Step 3: Quick Questions**

### **1. What’s the difference between a hard link and a soft link?**

| Soft Link (Symbolic) | Hard Link |
| --- | --- |
| Like a shortcut | Like a clone |
| Points to **filename** | Points to **inode (actual data)** |
| Can link to directories | Cannot link to directories (typically) |
| Breaks if original file is deleted | Still works if original is deleted |

**Example:**

```bash
bash
CopyEdit
ln -s original.txt shortcut.txt   # soft link
ln original.txt copy.txt          # hard link

```

### 2. chmod 7 5 4 0 r w x u g 0 a

Linux File Permissions Quick Reference

| User Type | Prefix | Permission Letters | Numeric Equivalent | Meaning |
| --- | --- | --- | --- | --- |
| Owner | `u` | `rwx` | 7 | Read + Write + Execute |
| Group | `g` | `r-x` | 5 | Read + Execute |
| Others | `o` | `r--` | 4 | Read Only |
| All Users | `a` | `---` | 0 | No Permissions |

Command Examples

- **Symbolic Method**: `chmod u+x,g-w,o+r file`
(Add execute to owner, remove write from group, add read to others)
- **Numeric Method**: `chmod 755 file`
(Owner=7=rwx, Group=5=r-x, Others=5=r-x)
- -rwx-wxr- - xxx..txt

Key Rules

1. **Symbols require user prefix** (`u`/`g`/`o`/`a`)
2. **Numeric values sum permissions** (`r=4`, `w=2`, `x=1`)

### 3. Pipe usage

pipe two commands together to find all `.log` files containing "Error".

```bash

find . -name "*.log" -exec grep "Error" {} \;
grep "Error" *.log
grep -r "Error" . --include="*.log"
find. -name "*.log" | xargs grep "Error"

xxx | sort | unique

```
